// import { useCallback, useEffect, useMemo, useState } from 'react'
// import {
//   Headset,
//   LayoutDashboard,
//   Ticket,
//   Users,
//   Settings,
//   Plus,
//   Search,
//   X,
//   RefreshCw,
// } from 'lucide-react'

// import { apiRequest } from './api'
// import './App.css'

// function Dashboard({ user, onLogout }) {
//   const [tickets, setTickets] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')

//   const [showCreateModal, setShowCreateModal] = useState(false)
//   const [creating, setCreating] = useState(false)
//   const [formError, setFormError] = useState('')

//   const [title, setTitle] = useState('')
//   const [description, setDescription] = useState('')
//   const [priority, setPriority] = useState('medium')

//   const loadTickets = useCallback(async () => {
//     setLoading(true)
//     setError('')

//     try {
//       const data = await apiRequest('/tickets')

//       if (!Array.isArray(data)) {
//         throw new Error('Unexpected response while loading tickets.')
//       }

//       setTickets(data)
//     } catch (err) {
//       setError(err.message || 'Failed to load tickets.')
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     loadTickets()
//   }, [loadTickets])

//   const statistics = useMemo(() => ({
//     total: tickets.length,
//     open: tickets.filter(ticket => ticket.status === 'open').length,
//     inProgress: tickets.filter(
//       ticket => ticket.status === 'in_progress'
//     ).length,
//     resolved: tickets.filter(
//       ticket => ticket.status === 'resolved'
//     ).length,
//   }), [tickets])

//   const filteredTickets = useMemo(() => {
//     const query = search.trim().toLowerCase()

//     if (!query) return tickets

//     return tickets.filter(ticket => (
//       ticket.title?.toLowerCase().includes(query) ||
//       String(ticket.id).includes(query) ||
//       ticket.priority?.toLowerCase().includes(query) ||
//       ticket.status?.toLowerCase().includes(query) ||
//       String(ticket.user_id).includes(query)
//     ))
//   }, [tickets, search])

//   function openModal() {
//     setTitle('')
//     setDescription('')
//     setPriority('medium')
//     setFormError('')
//     setShowCreateModal(true)
//   }

//   function closeModal() {
//     if (creating) return

//     setShowCreateModal(false)
//     setFormError('')
//   }

//   async function handleCreateTicket(event) {
//     event.preventDefault()

//     if (!title.trim()) {
//       setFormError('Please enter a ticket title.')
//       return
//     }

//     setCreating(true)
//     setFormError('')

//     try {
//       await apiRequest('/tickets', {
//         method: 'POST',
//         body: JSON.stringify({
//           title: title.trim(),
//           description: description.trim(),
//           priority,
//         }),
//       })

//       setShowCreateModal(false)
//       setTitle('')
//       setDescription('')
//       setPriority('medium')

//       await loadTickets()
//     } catch (err) {
//       setFormError(err.message || 'Failed to create ticket.')
//     } finally {
//       setCreating(false)
//     }
//   }

//   function handleModalKeyDown(event) {
//     if (event.key === 'Escape' && !creating) {
//       closeModal()
//     }
//   }

//   const displayName = user?.name || user?.email || 'there'

//   return (
//     <div className="app">
//       <aside className="sidebar">
//         <h2>
//           <Headset size={26} />
//           HelpDesk
//         </h2>

//         <p className="menu-label">WORKSPACE</p>

//         <a className="active" href="/" aria-current="page">
//           <LayoutDashboard size={19} />
//           Dashboard
//         </a>

//         <a href="/my-tickets">
//           <Ticket size={19} /> My Tickets
//         </a>

//         <a href="#tickets">
//           <Users size={19} />
//           Customers
//         </a>

//         <a href="#settings">
//           <Settings size={19} />
//           Settings
//         </a>

//         <div className="profile">
//           <div className="avatar">
//             {displayName.slice(0, 2).toUpperCase()}
//           </div>

//           <div className="profile-info">
//             <strong>{displayName}</strong>
//             <p>
//               {user?.role === 'admin'
//                 ? 'Administrator'
//                 : 'Support User'}
//             </p>
//           </div>

//           <button
//             type="button"
//             className="logout-button"
//             onClick={onLogout}
//           >
//             Log out
//           </button>
//         </div>
//       </aside>

//       <main className="main">
//         <header className="topbar">
//           <div>
//             <p>Workspace / Overview</p>
//             <h2>Dashboard</h2>
//           </div>

//           <button
//             type="button"
//             className="notification"
//             onClick={loadTickets}
//             disabled={loading}
//           >
//             <RefreshCw size={14} />
//             Refresh
//           </button>
//         </header>

//         <section className="welcome">
//           <div>
//             <span className="eyebrow">SUPPORT OVERVIEW</span>
//             <h1>Welcome back, {displayName} 👋</h1>
//             <p>
//               Here's what's happening with your support tickets today.
//             </p>
//           </div>

//           <button
//             type="button"
//             className="primary-button"
//             onClick={openModal}
//           >
//             <Plus size={19} />
//             Create Ticket
//           </button>
//         </section>

//         <section className="stats">
//           <div className="stat-card">
//             <span>Total Tickets</span>
//             <h2>{statistics.total}</h2>
//             <p>Across all statuses</p>
//           </div>

//           <div className="stat-card">
//             <span>Open Tickets</span>
//             <h2>{statistics.open}</h2>
//             <p>Awaiting attention</p>
//           </div>

//           <div className="stat-card">
//             <span>In Progress</span>
//             <h2>{statistics.inProgress}</h2>
//             <p>Currently being handled</p>
//           </div>

//           <div className="stat-card">
//             <span>Resolved</span>
//             <h2>{statistics.resolved}</h2>
//             <p>Successfully completed</p>
//           </div>
//         </section>

//         <section className="tickets-panel" id="tickets">
//           <div className="panel-heading">
//             <div>
//               <h3>Recent Tickets</h3>
//               <p>Track and manage your support requests</p>
//             </div>

//             <label className="search-box">
//               <Search size={18} />

//               <input
//                 type="search"
//                 name="ticket-search"
//                 aria-label="Search tickets"
//                 placeholder="Search tickets..."
//                 value={search}
//                 onChange={event => setSearch(event.target.value)}
//               />
//             </label>
//           </div>

//           {error && (
//             <div className="ticket-error" role="alert">
//               <span>{error}</span>

//               <button type="button" onClick={loadTickets}>
//                 Try again
//               </button>
//             </div>
//           )}

//           <div className="table-wrap">
//             <table>
//               <thead>
//                 <tr>
//                   <th>Ticket Details</th>
//                   <th>Requester</th>
//                   <th>Priority</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan="4">Loading tickets...</td>
//                   </tr>
//                 ) : error ? (
//                   <tr>
//                     <td colSpan="4">
//                       Tickets could not be loaded.
//                     </td>
//                   </tr>
//                 ) : filteredTickets.length === 0 ? (
//                   <tr>
//                     <td colSpan="4">
//                       {tickets.length === 0
//                         ? 'No tickets yet. Create your first ticket!'
//                         : 'No tickets match your search.'}
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredTickets.map(ticket => (
//                     <tr key={ticket.id}>
//                       <td>
//                         <strong>{ticket.title}</strong>
//                         <small>
//                           HD-{ticket.id} · Ticket #{ticket.id}
//                         </small>
//                       </td>

//                       <td>
//                         {String(ticket.user_id) === String(user?.id)
//                           ? 'You'
//                           : `User #${ticket.user_id}`}
//                       </td>

//                       <td>
//                         <span
//                           className={`priority ${
//                             ticket.priority?.toLowerCase()
//                           }`}
//                         >
//                           ● {ticket.priority}
//                         </span>
//                       </td>

//                       <td>
//                         <span
//                           className={`status ${
//                             ticket.status === 'in_progress'
//                               ? 'progress'
//                               : ticket.status
//                           }`}
//                         >
//                           {ticket.status?.replaceAll('_', ' ')}
//                         </span>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         <footer>HelpDesk Support Workspace</footer>
//       </main>

//       {showCreateModal && (
//         <div
//           className="modal-overlay"
//           onMouseDown={event => {
//             if (event.target === event.currentTarget) {
//               closeModal()
//             }
//           }}
//           onKeyDown={handleModalKeyDown}
//         >
//           <section
//             className="ticket-modal"
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="create-ticket-title"
//           >
//             <div className="modal-header">
//               <div>
//                 <span className="eyebrow">SUPPORT WORKSPACE</span>
//                 <h2 id="create-ticket-title">Create a ticket</h2>
//                 <p>
//                   Describe your issue and we'll get it tracked.
//                 </p>
//               </div>

//               <button
//                 type="button"
//                 className="modal-close"
//                 aria-label="Close create ticket dialog"
//                 onClick={closeModal}
//                 disabled={creating}
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleCreateTicket}>
//               <label htmlFor="ticket-title">Ticket title</label>
//               <input
//                 id="ticket-title"
//                 name="title"
//                 type="text"
//                 value={title}
//                 onChange={event => setTitle(event.target.value)}
//                 placeholder="e.g. Unable to access my account"
//                 maxLength={200}
//                 required
//                 autoFocus
//               />

//               <label htmlFor="ticket-description">Description</label>
//               <textarea
//                 id="ticket-description"
//                 name="description"
//                 value={description}
//                 onChange={event => setDescription(event.target.value)}
//                 placeholder="Explain the issue and what you've tried..."
//                 rows={4}
//               />

//               <label htmlFor="ticket-priority">Priority</label>
//               <select
//                 id="ticket-priority"
//                 name="priority"
//                 value={priority}
//                 onChange={event => setPriority(event.target.value)}
//               >
//                 <option value="low">Low</option>
//                 <option value="medium">Medium</option>
//                 <option value="high">High</option>
//                 <option value="urgent">Urgent</option>
//               </select>

//               {formError && (
//                 <p className="modal-error" role="alert">
//                   {formError}
//                 </p>
//               )}

//               <div className="modal-actions">
//                 <button
//                   type="button"
//                   className="modal-cancel"
//                   onClick={closeModal}
//                   disabled={creating}
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   type="submit"
//                   className="primary-button"
//                   disabled={creating || !title.trim()}
//                 >
//                   {creating ? 'Creating...' : 'Create ticket'}
//                 </button>
//               </div>
//             </form>
//           </section>
//         </div>
//       )}
//     </div>
//   )
// }

// export default Dashboard






import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Headset,
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  Plus,
  Search,
  X,
  RefreshCw,
  Menu,
} from 'lucide-react'

import { apiRequest } from './api'
import './App.css'

function Dashboard({ user, onLogout }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/tickets')

      if (!Array.isArray(data)) {
        throw new Error('Unexpected response while loading tickets.')
      }

      setTickets(data)
    } catch (err) {
      setError(err.message || 'Failed to load tickets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const statistics = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(ticket => ticket.status === 'open').length,
    inProgress: tickets.filter(
      ticket => ticket.status === 'in_progress'
    ).length,
    resolved: tickets.filter(
      ticket => ticket.status === 'resolved'
    ).length,
  }), [tickets])

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return tickets

    return tickets.filter(ticket => (
      ticket.title?.toLowerCase().includes(query) ||
      String(ticket.id).includes(query) ||
      ticket.priority?.toLowerCase().includes(query) ||
      ticket.status?.toLowerCase().includes(query) ||
      String(ticket.user_id).includes(query)
    ))
  }, [tickets, search])

  function openModal() {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setFormError('')
    setShowCreateModal(true)
  }

  function closeModal() {
    if (creating) return

    setShowCreateModal(false)
    setFormError('')
  }

  async function handleCreateTicket(event) {
    event.preventDefault()

    if (!title.trim()) {
      setFormError('Please enter a ticket title.')
      return
    }

    setCreating(true)
    setFormError('')

    try {
      await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
        }),
      })

      setShowCreateModal(false)
      setTitle('')
      setDescription('')
      setPriority('medium')

      await loadTickets()
    } catch (err) {
      setFormError(err.message || 'Failed to create ticket.')
    } finally {
      setCreating(false)
    }
  }

  function handleModalKeyDown(event) {
    if (event.key === 'Escape' && !creating) {
      closeModal()
    }
  }

  const displayName = user?.name || user?.email || 'there'

  return (
    <div className="app">
      <aside
        className={`sidebar${mobileMenuOpen ? ' sidebar-open' : ''}`}
      >
        <div className="sidebar-brand-row">
          <h2>
            <Headset size={26} />
            HelpDesk
          </h2>

          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label={
              mobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="helpdesk-navigation"
            onClick={() => setMobileMenuOpen(open => !open)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav
          id="helpdesk-navigation"
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          <p className="menu-label">WORKSPACE</p>

          <a
            className="active"
            href="/"
            aria-current="page"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </a>

          <a
            href="/my-tickets"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Ticket size={19} />
            My Tickets
          </a>

          <a
            href="#tickets"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Users size={19} />
            Customers
          </a>

          <a
            href="#settings"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Settings size={19} />
            Settings
          </a>
        </nav>

        <div className="profile">
          <div className="avatar">
            {displayName.slice(0, 2).toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>{displayName}</strong>
            <p>
              {user?.role === 'admin'
                ? 'Administrator'
                : 'Support User'}
            </p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p>Workspace / Overview</p>
            <h2>Dashboard</h2>
          </div>

          <button
            type="button"
            className="notification"
            onClick={loadTickets}
            disabled={loading}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow">SUPPORT OVERVIEW</span>

            <h1 className="welcome-title">
              Welcome back, {displayName}{' '}
              <span className="welcome-emoji" aria-hidden="true">
                👋
              </span>
            </h1>

            <p>
              Here's what's happening with your support tickets today.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openModal}
          >
            <Plus size={19} />
            Create Ticket
          </button>
        </section>

        <section className="stats">
          <div className="stat-card">
            <span>Total Tickets</span>
            <h2>{statistics.total}</h2>
            <p>Across all statuses</p>
          </div>

          <div className="stat-card">
            <span>Open Tickets</span>
            <h2>{statistics.open}</h2>
            <p>Awaiting attention</p>
          </div>

          <div className="stat-card">
            <span>In Progress</span>
            <h2>{statistics.inProgress}</h2>
            <p>Currently being handled</p>
          </div>

          <div className="stat-card">
            <span>Resolved</span>
            <h2>{statistics.resolved}</h2>
            <p>Successfully completed</p>
          </div>
        </section>

        <section className="tickets-panel" id="tickets">
          <div className="panel-heading">
            <div>
              <h3>Recent Tickets</h3>
              <p>Track and manage your support requests</p>
            </div>

            <label className="search-box">
              <Search size={18} />

              <input
                type="search"
                name="ticket-search"
                aria-label="Search tickets"
                placeholder="Search tickets..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </label>
          </div>

          {error && (
            <div className="ticket-error" role="alert">
              <span>{error}</span>

              <button type="button" onClick={loadTickets}>
                Try again
              </button>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket Details</th>
                  <th>Requester</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">Loading tickets...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4">
                      Tickets could not be loaded.
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      {tickets.length === 0
                        ? 'No tickets yet. Create your first ticket!'
                        : 'No tickets match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <strong>{ticket.title}</strong>
                        <small>
                          HD-{ticket.id} · Ticket #{ticket.id}
                        </small>
                      </td>

                      <td>
                        {String(ticket.user_id) === String(user?.id)
                          ? 'You'
                          : `User #${ticket.user_id}`}
                      </td>

                      <td>
                        <span
                          className={`priority ${
                            ticket.priority?.toLowerCase()
                          }`}
                        >
                          ● {ticket.priority}
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
                          {ticket.status?.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>HelpDesk Support Workspace</footer>
      </main>

      {showCreateModal && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closeModal()
            }
          }}
          onKeyDown={handleModalKeyDown}
        >
          <section
            className="ticket-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-ticket-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">SUPPORT WORKSPACE</span>
                <h2 id="create-ticket-title">Create a ticket</h2>
                <p>
                  Describe your issue and we'll get it tracked.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                aria-label="Close create ticket dialog"
                onClick={closeModal}
                disabled={creating}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <label htmlFor="ticket-title">Ticket title</label>
              <input
                id="ticket-title"
                name="title"
                type="text"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="e.g. Unable to access my account"
                maxLength={200}
                required
                autoFocus
              />

              <label htmlFor="ticket-description">Description</label>
              <textarea
                id="ticket-description"
                name="description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Explain the issue and what you've tried..."
                rows={4}
              />

              <label htmlFor="ticket-priority">Priority</label>
              <select
                id="ticket-priority"
                name="priority"
                value={priority}
                onChange={event => setPriority(event.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              {formError && (
                <p className="modal-error" role="alert">
                  {formError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeModal}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating || !title.trim()}
                >
                  {creating ? 'Creating...' : 'Create ticket'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard
