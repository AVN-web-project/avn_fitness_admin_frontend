import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, RefreshCw, Send, AlertCircle, Clock } from 'lucide-react';
import { supportApi } from '../../services/supportApi.js';
import PageHeader from '../../components/layout/PageHeader.jsx';
import DataTable from '../../components/common/DataTable.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import { usePagination } from '../../hooks/usePagination.js';
import { formatDate } from '../../utils/formatDate.js';
import { SUPPORT_STATUS } from '../../utils/constants.js';

export const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ticket Detail & Reply Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  const pagination = usePagination(1, 20);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await supportApi.getSupportQueue({
        page: pagination.page,
        limit: pagination.limit,
      });

      setTickets(res.tickets || res.items || []);
      if (res.pagination) {
        pagination.setTotal(res.pagination.total || 0);
      }
    } catch (err) {
      setError(err.message || 'Failed to load support requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [pagination.page]);

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status || 'open');
    setReplyMessage('');
    setReplyError('');
    setIsDetailModalOpen(true);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsReplying(true);
    setReplyError('');

    try {
      await supportApi.replyToTicket(selectedTicket._id, replyMessage.trim());
      await supportApi.updateTicketStatus(selectedTicket._id, ticketStatus);
      setIsDetailModalOpen(false);
      setSelectedTicket(null);
      await fetchTickets();
    } catch (err) {
      setReplyError(err.message || 'Failed to reply to ticket.');
    } finally {
      setIsReplying(false);
    }
  };

  const columns = [
    {
      header: 'Ticket #',
      key: 'ticketNumber',
      render: (row) => (
        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
          {row.ticketNumber || row._id}
        </span>
      ),
    },
    {
      header: 'Subject',
      key: 'subject',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200">{row.subject}</div>
          <div className="text-xs text-slate-400 line-clamp-1">{row.message || row.description}</div>
        </div>
      ),
    },
    {
      header: 'Customer',
      key: 'user',
      render: (row) => row.user?.name || row.email || 'Customer',
    },

    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created',
      key: 'createdAt',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs py-1 px-2.5"
          leftIcon={MessageSquare}
          onClick={() => handleOpenTicket(row)}
        >
          Reply / Resolve
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Support Queue"
        subtitle="Manage customer inquiries, order assistance, and support tickets."
      />

      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={fetchTickets}>
          Refresh Queue
        </Button>
      </div>

      <div className="space-y-0">
        <DataTable
          columns={columns}
          data={tickets}
          isLoading={loading}
          error={error}
          onRetry={fetchTickets}
          emptyTitle="Support queue is clear"
          emptyMessage="No open support tickets requiring attention right now."
        />

        {!loading && !error && tickets.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onNext={pagination.nextPage}
            onPrev={pagination.prevPage}
            hasNext={pagination.hasNextPage}
            hasPrev={pagination.hasPrevPage}
          />
        )}
      </div>

      {/* Ticket Reply & Resolve Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Support Ticket: ${selectedTicket?.ticketNumber || selectedTicket?._id}`}
        maxWidth="max-w-xl"
      >
        {replyError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{replyError}</span>
          </div>
        )}

        {/* Customer Message Details */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>From: <strong className="text-slate-800 dark:text-slate-200">{selectedTicket?.user?.name || selectedTicket?.email}</strong></span>
            <span>{formatDate(selectedTicket?.createdAt)}</span>
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedTicket?.subject}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {selectedTicket?.message || selectedTicket?.description}
          </p>
        </div>

        {/* Conversation history if any */}
        {selectedTicket?.replies?.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            <div className="text-xs font-semibold uppercase text-slate-400">Previous Replies:</div>
            {selectedTicket.replies.map((r, i) => (
              <div key={i} className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg text-xs border border-blue-100 dark:border-blue-900/40">
                <div className="font-semibold text-blue-700 dark:text-blue-400">{r.senderName || 'Staff Member'}</div>
                <div className="text-slate-600 dark:text-slate-300 mt-1">{r.message}</div>
              </div>
            ))}
          </div>
        )}

        {/* Status pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Ticket Status
            </label>
            <select
              value={ticketStatus}
              onChange={(e) => setTicketStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SUPPORT_STATUS.OPEN}>Open</option>
              <option value={SUPPORT_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={SUPPORT_STATUS.RESOLVED}>Resolved</option>
              <option value={SUPPORT_STATUS.CLOSED}>Closed</option>
            </select>
          </div>

          {/* Reply Text Form */}
          <form onSubmit={handleSendReply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Staff Response / Resolution Message
              </label>
              <textarea
                rows={3}
                required
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your official support response to customer here..."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isReplying} leftIcon={Send}>
                Send Reply & Update
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SupportPage;
