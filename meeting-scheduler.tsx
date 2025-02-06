import React, { useState } from 'react';
import { Calendar, Clock, Edit, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MeetingScheduler = () => {
  const [meetings, setMeetings] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const initialMeetingState = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    organizer: ''
  };

  const [newMeeting, setNewMeeting] = useState(initialMeetingState);

  const MAX_DURATION_HOURS = 4;
  const MIN_DURATION_MINUTES = 15;

  const isTimeSlotAvailable = (date, startTime, endTime, excludeMeetingId = null) => {
    return !meetings.some(meeting => {
      if (meeting.id === excludeMeetingId) return false;
      if (meeting.date !== date) return false;
      
      const newStart = new Date(`${date}T${startTime}`);
      const newEnd = new Date(`${date}T${endTime}`);
      const existingStart = new Date(`${meeting.date}T${meeting.startTime}`);
      const existingEnd = new Date(`${meeting.date}T${meeting.endTime}`);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
  };

  const validateMeetingDuration = (startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const durationMs = end - start;
    const durationMinutes = durationMs / (1000 * 60);
    
    if (durationMinutes < MIN_DURATION_MINUTES) {
      return `Meeting must be at least ${MIN_DURATION_MINUTES} minutes long`;
    }
    
    if (durationMinutes > MAX_DURATION_HOURS * 60) {
      return `Meeting cannot exceed ${MAX_DURATION_HOURS} hours`;
    }
    
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const meetingData = editingMeeting || newMeeting;

    if (!meetingData.title || !meetingData.date || !meetingData.startTime || !meetingData.endTime || !meetingData.organizer) {
      setError('Please fill in all fields');
      return;
    }

    if (new Date(`${meetingData.date}T${meetingData.startTime}`) >= new Date(`${meetingData.date}T${meetingData.endTime}`)) {
      setError('End time must be after start time');
      return;
    }

    const durationError = validateMeetingDuration(meetingData.startTime, meetingData.endTime);
    if (durationError) {
      setError(durationError);
      return;
    }

    const isAvailable = isTimeSlotAvailable(
      meetingData.date, 
      meetingData.startTime, 
      meetingData.endTime,
      editingMeeting?.id
    );

    if (!isAvailable) {
      setError('This time slot is already booked');
      return;
    }

    if (editingMeeting) {
      setMeetings(meetings.map(meeting => 
        meeting.id === editingMeeting.id ? {...meetingData, id: meeting.id} : meeting
      ));
      setEditingMeeting(null);
    } else {
      setMeetings([...meetings, {...meetingData, id: Date.now()}]);
    }

    setNewMeeting(initialMeetingState);
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setNewMeeting(meeting);
  };

  const handleDelete = (meetingId) => {
    setMeetings(meetings.filter(meeting => meeting.id !== meetingId));
    if (editingMeeting?.id === meetingId) {
      setEditingMeeting(null);
      setNewMeeting(initialMeetingState);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const CalendarView = () => {
    const timeSlots = generateTimeSlots();
    const dayMeetings = meetings.filter(meeting => meeting.date === selectedDate);

    return (
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <div className="relative min-w-[600px]">
          <div className="grid grid-cols-[100px_1fr] border-t border-l">
            {timeSlots.map((time, index) => (
              <React.Fragment key={time}>
                <div className="border-b border-r p-2 text-sm">{time}</div>
                <div className="border-b border-r p-2 relative min-h-[40px]">
                  {dayMeetings.map((meeting) => {
                    const startTime = meeting.startTime;
                    const endTime = meeting.endTime;
                    if (time === startTime) {
                      const startDate = new Date(`2000-01-01T${startTime}`);
                      const endDate = new Date(`2000-01-01T${endTime}`);
                      const durationMinutes = (endDate - startDate) / (1000 * 60);
                      const height = (durationMinutes / 30) * 40;
                      
                      return (
                        <div
                          key={meeting.id}
                          className="absolute left-0 right-0 bg-blue-100 p-2 rounded border border-blue-300 overflow-hidden"
                          style={{ height: `${height}px` }}
                        >
                          <div className="font-medium text-sm">{meeting.title}</div>
                          <div className="text-xs text-gray-600">{meeting.organizer}</div>
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              onClick={() => handleEdit(meeting)}
                              className="p-1 hover:bg-blue-200 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(meeting.id)}
                              className="p-1 hover:bg-blue-200 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ListItem = ({ meeting }) => (
    <div className="p-4 border rounded relative">
      <div className="font-medium">{meeting.title}</div>
      <div className="text-sm text-gray-600">
        Organizer: {meeting.organizer}
      </div>
      <div className="text-sm text-gray-600">
        Date: {new Date(meeting.date).toLocaleDateString()}
      </div>
      <div className="text-sm text-gray-600">
        Time: {meeting.startTime} - {meeting.endTime}
      </div>
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={() => handleEdit(meeting)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(meeting.id)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Conference Room Scheduler
            {editingMeeting && (
              <button
                onClick={() => {
                  setEditingMeeting(null);
                  setNewMeeting(initialMeetingState);
                }}
                className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="h-4 w-4" /> Cancel Editing
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Title</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Organizer</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={newMeeting.organizer}
                  onChange={(e) => setNewMeeting({...newMeeting, organizer: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </form>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Scheduled Meetings
            </div>
            <button
              onClick={() => setShowCalendarView(!showCalendarView)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Switch to {showCalendarView ? 'List' : 'Calendar'} View
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCalendarView ? (
            <CalendarView />
          ) : (
            <div className="space-y-4">
              {meetings.length === 0 ? (
                <p className="text-gray-500 text-center">No meetings scheduled</p>
              ) : (
                meetings
                  .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))
                  .map((meeting) => (
                    <ListItem key={meeting.id} meeting={meeting} />
                  ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingScheduler;
