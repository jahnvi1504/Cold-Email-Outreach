import { useEffect, useState } from 'react';
import { api, googleLoginUrl, slackConnectUrl } from './api';
import type { EmailJob, ScheduleInput, User } from './types';

const formatDate = (value: string | null | undefined) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function Button({ children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'quiet' | 'danger' }) {
  return <button className={`button button-${variant}`} {...props}>{children}</button>;
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={(event) => event.stopPropagation()}>{children}</section></div>;
}

function EmptyState({ text }: { text: string }) { return <div className="empty"><span className="empty-mark">+</span><strong>{text}</strong><small>Your workspace will appear here once you schedule your first campaign.</small></div>; }

function JobsTable({ jobs, sent }: { jobs: EmailJob[]; sent?: boolean }) {
  if (!jobs.length) return <EmptyState text={sent ? 'No sent emails yet' : 'No scheduled emails yet'} />;
  return <div className="table-wrap"><table><thead><tr><th>Recipient</th><th>Subject</th><th>{sent ? 'Processed' : 'Scheduled'}</th><th>Status</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td className="recipient">{job.recipient}</td><td>{job.subject}</td><td>{formatDate(sent ? job.processedAt : job.scheduledAt)}</td><td><span className={`badge badge-${job.status}`}>{job.status}</span></td></tr>)}</tbody></table></div>;
}

function Composer({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => void }) {
  const [input, setInput] = useState({ subject: '', body: '', startTime: '', delayBetweenEmails: 1000, hourlyLimit: 100 });
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState('');
  const parseFile = async (file: File) => { const text = await file.text(); const found = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []; setRecipients([...new Set(found.map((email) => email.toLowerCase()))]); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(''); try { await api.schedule({ ...input, recipients, startTime: new Date(input.startTime).toISOString() }); onScheduled(); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to schedule emails'); } };
  return <Modal onClose={onClose}><div className="modal-head"><div><p className="eyebrow">New campaign</p><h2>Compose email job</h2></div><button className="close" onClick={onClose}>×</button></div><form onSubmit={submit} className="form"><label>Subject<input required value={input.subject} onChange={(event) => setInput({ ...input, subject: event.target.value })} placeholder="A thoughtful note" /></label><label>Message<textarea required rows={6} value={input.body} onChange={(event) => setInput({ ...input, body: event.target.value })} placeholder="Write your message..." /></label><label>Lead file<input required type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => event.target.files?.[0] && parseFile(event.target.files[0])} /><span className="file-note">{recipients.length ? `${recipients.length} unique emails detected` : 'Upload a CSV or text file'}</span></label><div className="form-grid"><label>Start time<input required type="datetime-local" value={input.startTime} onChange={(event) => setInput({ ...input, startTime: event.target.value })} /></label><label>Delay (ms)<input required min="0" type="number" value={input.delayBetweenEmails} onChange={(event) => setInput({ ...input, delayBetweenEmails: Number(event.target.value) })} /></label><label>Hourly limit<input required min="1" type="number" value={input.hourlyLimit} onChange={(event) => setInput({ ...input, hourlyLimit: Number(event.target.value) })} /></label></div>{error && <div className="error">{error}</div>}<div className="modal-actions"><Button type="button" variant="quiet" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!recipients.length}>Schedule {recipients.length ? `${recipients.length} emails` : 'emails'}</Button></div></form></Modal>;
}

export function App() {
  const [user, setUser] = useState<User | null>(null); const [tab, setTab] = useState<'scheduled' | 'sent'>('scheduled'); const [jobs, setJobs] = useState<EmailJob[]>([]); const [compose, setCompose] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = async () => { setLoading(true); try { setJobs(tab === 'scheduled' ? await api.scheduled() : await api.sent()); setError(''); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load emails'); } finally { setLoading(false); } };
  useEffect(() => { api.me().then(setUser).catch(() => setUser(null)); }, []); useEffect(() => { if (user) load(); }, [user, tab]);
  if (!user) return <main className="login"><div className="login-art"><span>RI</span><p>Make every send feel intentional.</p></div><div className="login-panel"><p className="eyebrow">ReachInbox / email operations</p><h1>Your sending desk, <em>uncluttered.</em></h1><p className="lede">Schedule thoughtful outreach with a queue that keeps its promises, even when your laptop goes quiet.</p><a className="button button-primary google" href={googleLoginUrl}>Continue with Google <span>↗</span></a><small>Secure OAuth login. No passwords stored here.</small></div></main>;
  return <div className="app-shell"><header><div className="brand"><span className="brand-mark">RI</span><span>ReachInbox</span></div><div className="header-actions"><a className="slack-link" href={slackConnectUrl}>Connect Slack <span>↗</span></a><div className="profile"><img src={user.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} /><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button className="logout" onClick={() => api.logout().then(() => setUser(null))}>Logout</button></div></header><main className="dashboard"><div className="dash-intro"><div><p className="eyebrow">Workspace / {user.name}</p><h1>Email jobs</h1><p className="lede">A calm view of everything leaving your desk.</p></div><Button onClick={() => setCompose(true)}>＋ Compose new email</Button></div><nav className="tabs"><button className={tab === 'scheduled' ? 'active' : ''} onClick={() => setTab('scheduled')}>Scheduled emails</button><button className={tab === 'sent' ? 'active' : ''} onClick={() => setTab('sent')}>Sent emails</button><span className="tab-rule" /></nav>{error && <div className="error">{error}</div>}{loading ? <div className="loading">Loading your queue<span>•••</span></div> : <JobsTable jobs={jobs} sent={tab === 'sent'} />}</main>{compose && <Composer onClose={() => setCompose(false)} onScheduled={load} />}</div>;
}
