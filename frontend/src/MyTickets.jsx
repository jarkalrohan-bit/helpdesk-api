import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Ticket,
  RefreshCw,
  Eye,
} from 'lucide-react'

import { apiRequest } from './api'
import './App.css'

export default function MyTickets() {
  const navigate = useNavigate()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')

  async function loadTickets() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/tickets')
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load tickets')

      if (
        err.message?.toLowerCase().includes('token') ||
        err.message?.toLowerCase().includes('authorization')
      ) {
        localStorage.removeItem('helpdesk_token')
        localStorage.removeItem('helpdesk_user')
        navigate('/login', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tickets.filter(ticket => {
      const matchesSearch =
        !query ||
        String(ticket.id).includes(query) ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query)

      const matchesStatus =
        status === 'all' || ticket.status === status

      const matchesPriority =
        priority === 'all' || ticket.priority === priority

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, status, priority])

  function formatStatus(value) {
    return (value || 'unknown')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase())
  }

  return (
    <main className="my-tickets-page">
      <header className="my-tickets-header">
        <button
          type="button"
          className="tickets-back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="my-tickets-title">
          <div className="my-tickets-icon">
            <Ticket size={24} />
          </div>

          <div>
            <h1>My Tickets</h1>
            <p>View and manage your support requests.</p>
          </div>
        </div>

        <button
          type="button"
          className="tickets-refresh-button"
          onClick={loadTickets}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="my-tickets-panel">
        <div className="my-tickets-toolbar">
          <label className="search-box my-tickets-search">
            <Search size={18} />

            <input
              type="search"
              name="ticket-search"
              aria-label="Search tickets"
              placeholder="Search by ticket ID, title or description..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>

          <select
            aria-label="Filter by status"
            name="ticket-status-filter"
            value={status}
            onChange={event => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            aria-label="Filter by priority"
            name="ticket-priority-filter"
            value={priority}
            onChange={event => setPriority(event.target.value)}
          >
            <option value="all">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="my-tickets-count">
          Showing {filteredTickets.length} of {tickets.length} tickets
        </div>

        {loading ? (
          <div className="tickets-empty">
            Loading your tickets...
          </div>
        ) : error ? (
          <div className="tickets-error" role="alert">
            {error}
            <button type="button" onClick={loadTickets}>
              Try again
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="tickets-empty">
            <Ticket size={34} />
            <h3>No tickets found</h3>
            <p>
              {tickets.length
                ? 'Try changing your search or filters.'
                : 'Your support requests will appear here.'}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/')}
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="my-tickets-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Created</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.title}</strong>
                      <small>HD-{ticket.id}</small>
                    </td>

                    <td>
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    <td>
                      <span
                        className={`priority ${
                          ticket.priority?.toLowerCase()
                        }`}
                      >
                        ● {formatStatus(ticket.priority)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status ${
                          ticket.status === 'in_progress'
                            ? 'progress'
                            : ticket.status
                        }`}
                      >
                        {formatStatus(ticket.status)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ticket-view-button"
                        onClick={() =>
                          navigate(`/tickets/${ticket.id}`)
                        }
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}