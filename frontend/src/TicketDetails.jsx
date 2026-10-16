import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ticket,
  Send,
  RefreshCw,
  MessageCircle,
} from 'lucide-react'

import { apiRequest } from './api'
import './App.css'

export default function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState(null)
  const [comments, setComments] = useState([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [commentError, setCommentError] = useState('')

  const loadTicket = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [ticketData, commentData] = await Promise.all([
        apiRequest(`/tickets/${id}`),
        apiRequest(`/tickets/${id}/comments`),
      ])

      setTicket(ticketData)
      setComments(Array.isArray(commentData) ? commentData : [])
    } catch (err) {
      setError(err.message || 'Unable to load ticket details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadTicket()
  }, [loadTicket])

  async function handleCommentSubmit(event) {
    event.preventDefault()

    if (!comment.trim()) {
      setCommentError('Please enter a comment.')
      return
    }

    setSending(true)
    setCommentError('')

    try {
      const newComment = await apiRequest(
        `/tickets/${id}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: comment.trim(),
          }),
        }
      )

      setComments(previous => [...previous, newComment])
      setComment('')
    } catch (err) {
      setCommentError(err.message || 'Unable to send comment')
    } finally {
      setSending(false)
    }
  }

  function formatStatus(value) {
    return (value || 'unknown')
      .replaceAll('_', ' ')
      .replace(/\b\w/g, letter => letter.toUpperCase())
  }

  if (loading) {
    return (
      <main className="ticket-details-page">
        <p className="ticket-details-message">Loading ticket details...</p>
      </main>
    )
  }

  if (error || !ticket) {
    return (
      <main className="ticket-details-page">
        <button
          type="button"
          className="tickets-back-button"
          onClick={() => navigate('/my-tickets')}
        >
          <ArrowLeft size={18} /> Back to My Tickets
        </button>

        <div className="ticket-details-error" role="alert">
          {error || 'Ticket not found'}
        </div>

        <button
          type="button"
          className="tickets-refresh-button"
          onClick={loadTicket}
        >
          <RefreshCw size={16} /> Try again
        </button>
      </main>
    )
  }

  return (
    <main className="ticket-details-page">
      <header className="ticket-details-header">
        <button
          type="button"
          className="tickets-back-button"
          onClick={() => navigate('/my-tickets')}
        >
          <ArrowLeft size={18} /> Back to My Tickets
        </button>

        <button
          type="button"
          className="tickets-refresh-button"
          onClick={loadTicket}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <section className="ticket-details-card">
        <div className="ticket-details-heading">
          <div className="my-tickets-icon">
            <Ticket size={24} />
          </div>

          <div>
            <p className="ticket-reference">HD-{ticket.id}</p>
            <h1>{ticket.title}</h1>
            <p className="ticket-created">
              Created{' '}
              {ticket.created_at
                ? new Date(ticket.created_at).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="ticket-details-badges">
          <span
            className={`status ${
              ticket.status === 'in_progress'
                ? 'progress'
                : ticket.status
            }`}
          >
            {formatStatus(ticket.status)}
          </span>

          <span
            className={`priority ${ticket.priority}`}
          >
            ● {formatStatus(ticket.priority)}
          </span>
        </div>

        <div className="ticket-description-section">
          <h3>Description</h3>
          <p className="ticket-description">
            {ticket.description || 'No description was provided.'}
          </p>
        </div>

        <div className="ticket-metadata">
          <div>
            <span>Ticket ID</span>
            <strong>#{ticket.id}</strong>
          </div>

          <div>
            <span>Requester ID</span>
            <strong>{ticket.user_id}</strong>
          </div>

          <div>
            <span>Last updated</span>
            <strong>
              {ticket.updated_at
                ? new Date(ticket.updated_at).toLocaleDateString()
                : '—'}
            </strong>
          </div>
        </div>
      </section>

      <section className="ticket-comments-card">
        <div className="ticket-comments-heading">
          <div>
            <h2>
              <MessageCircle size={20} />
              Conversation
            </h2>
            <p>Comments and updates for this ticket.</p>
          </div>

          <span className="comment-count">{comments.length}</span>
        </div>

        <div className="ticket-comments-list">
          {comments.length === 0 ? (
            <div className="ticket-no-comments">
              <MessageCircle size={27} />
              <p>No comments yet. Start the conversation below.</p>
            </div>
          ) : (
            comments.map(item => (
              <article className="ticket-comment" key={item.id}>
                <div className="comment-avatar">
                  {(item.author_name || 'U')
                    .slice(0, 1)
                    .toUpperCase()}
                </div>

                <div className="comment-content">
                  <div className="comment-meta">
                    <strong>
                      {item.author_name || `User #${item.user_id}`}
                    </strong>

                    <span>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : ''}
                    </span>
                  </div>

                  <p>{item.content}</p>
                </div>
              </article>
            ))
          )}
        </div>

        <form
          className="ticket-comment-form"
          onSubmit={handleCommentSubmit}
        >
          <label htmlFor="ticket-comment-input">
            Add a comment
          </label>

          <textarea
            id="ticket-comment-input"
            name="content"
            value={comment}
            onChange={event => setComment(event.target.value)}
            placeholder="Write an update or ask a question..."
            rows={3}
            maxLength={5000}
            required
          />

          {commentError && (
            <p className="ticket-comment-error" role="alert">
              {commentError}
            </p>
          )}

          <div className="ticket-comment-actions">
            <span>Keep your update clear and helpful.</span>

            <button
              type="submit"
              className="primary-button"
              disabled={sending || !comment.trim()}
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send comment'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}