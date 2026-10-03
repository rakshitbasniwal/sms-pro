import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('10');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/timetable?className=${className}`);
      setTimetable(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [className]);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Timetable Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Class (e.g. 10)" 
            value={className}
            onChange={(e) => setClassName(e.target.value)}
          />
          <button className="btn btn-primary" onClick={fetchTimetable}>Search</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div>Loading timetable...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Time</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {timetable.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center' }}>No timetable entries found.</td>
                  </tr>
                ) : (
                  timetable.map((entry, idx) => (
                    <tr key={entry._id || idx}>
                      <td>{entry.day}</td>
                      <td>{entry.subject?.name || entry.subject || '-'}</td>
                      <td>{entry.teacher?.firstName ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : entry.teacher || '-'}</td>
                      <td>{entry.startTime} - {entry.endTime}</td>
                      <td>{entry.room || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
