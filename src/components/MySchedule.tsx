import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Reminder } from '../types';
import { useState } from 'react';

interface MyScheduleProps {
  reminders: Reminder[];
  googleEvents: any[];
  isGoogleAuthenticated: boolean;
  onConnectGoogle: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onAddMeeting?: (title: string, date: string, time: string) => void;
}

export default function MySchedule({ 
  reminders, 
  googleEvents, 
  isGoogleAuthenticated, 
  onConnectGoogle, 
  onSync,
  isSyncing,
  onAddMeeting 
}: MyScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Simple calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filter meetings for the current month
  const monthMeetings = reminders.filter(r => {
    // Assuming time string might contain date info or we just show all for demo
    return true; 
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const handleAdd = () => {
    if (newTitle && newDate && newTime) {
      onAddMeeting?.(newTitle, newDate, newTime);
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-8">
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-surface-container rounded-[2.5rem] p-8 shadow-2xl border border-surface-container-high"
          >
            <h3 className="text-2xl font-bold font-headline text-on-surface mb-6">New Neural Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">Topic / Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Python Research, Amazon Job Prep"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">Date</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-on-surface-variant mb-2">Time</label>
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-surface-variant text-on-surface font-bold hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
              >
                Schedule Task
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Calendar Section */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-surface-container shadow-sm border border-surface-container-high">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-headline text-on-surface">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {isGoogleAuthenticated ? 'Google Calendar Synchronized' : 'Neural Schedule Synchronization'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!isGoogleAuthenticated ? (
                  <button 
                    onClick={onConnectGoogle}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    Connect Google Calendar
                  </button>
                ) : (
                  <button 
                    onClick={onSync}
                    disabled={isSyncing}
                    className={`p-2 hover:bg-surface-container-high rounded-xl transition-all ${isSyncing ? 'animate-spin' : ''}`}
                  >
                    <Clock size={20} className="text-primary" />
                  </button>
                )}
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-2 hover:bg-surface-container-high rounded-xl transition-all">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={nextMonth} className="p-2 hover:bg-surface-container-high rounded-xl transition-all">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {blanks.map(i => <div key={`blank-${i}`} className="aspect-square" />)}
              {days.map(day => {
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                
                // Check if any reminder falls on this day
                const hasMeeting = reminders.some(r => {
                  const reminderDate = new Date(r.time);
                  return !isNaN(reminderDate.getTime()) && 
                         reminderDate.getDate() === day && 
                         reminderDate.getMonth() === currentDate.getMonth() &&
                         reminderDate.getFullYear() === currentDate.getFullYear();
                });
                
                return (
                  <motion.div 
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all ${
                      isToday ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    <span className="text-sm font-bold">{day}</span>
                    {hasMeeting && !isToday && (
                      <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setShowAddModal(true)}
              className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center gap-4 hover:bg-primary/10 transition-all group"
            >
              <div className="p-3 bg-primary rounded-2xl text-white group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-on-surface">New Meeting</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Manual Entry</span>
              </div>
            </button>
            <button className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex items-center gap-4 hover:bg-secondary/10 transition-all group">
              <div className="p-3 bg-secondary rounded-2xl text-white group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div className="text-left">
                <span className="block text-sm font-bold text-on-surface">Neural Sync</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Auto-Optimize</span>
              </div>
            </button>
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-surface-container shadow-sm border border-surface-container-high h-full">
            <h3 className="text-lg font-bold font-headline text-on-surface mb-6">Upcoming Events</h3>
            <div className="space-y-4">
              {isGoogleAuthenticated && googleEvents.length > 0 ? (
                googleEvents.map((event) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/10 flex items-start gap-4"
                  >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <CalendarIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">{event.summary}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium">
                        {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : 'All Day'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <motion.div 
                    key={reminder.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant/10 flex items-start gap-4"
                  >
                    <div className={`p-2 rounded-xl ${
                      reminder.priority === 'high' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                    }`}>
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">{reminder.title}</h4>
                      <p className="text-[10px] text-on-surface-variant font-medium">{reminder.time}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-on-surface-variant">No upcoming events found.</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <User size={16} className="text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Neural Insight</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your schedule density is optimal for deep work this week. I've blocked out 2 hours on Wednesday for neural training.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
