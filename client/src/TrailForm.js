import React, { useState } from 'react';

const TrailForm = ({ drawTrail, onSave, setIsDrawingMode, setDrawTrail, setShowForm}) => {
  const [name, setName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trailData = {
      timestamp: Date.now(),
      name,
      dateTime,
      phone,
      path: drawTrail,
      password,
      notes
    };
    onSave(trailData);
    setIsDrawingMode(false);
    setDrawTrail([]);
  };

  const handleCancel = () => {
    setIsDrawingMode(false);
    setDrawTrail([]);
    setShowForm(false); // Hide the form when canceling
  };


  return (
    <div className="trail-form-popup">
      <form onSubmit={handleSubmit}>
        <label className='form-field'>
          Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className='form-field'>
          Date and Time:
          <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} required />
        </label>
        <label className='form-field'>
          Contact Phone (will not be displayed):
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className='form-field'>
          Notes:
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className='form-field'>
          Passcode:
          <input type="tel" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className='form-btn' type="button" onClick={handleCancel}>Cancel</button>
        <button className='form-btn' type="submit">Save</button>
      </form>
    </div>
  );
};

export default TrailForm;
