import React, { useState } from 'react';

const TrailForm = ({ drawTrail, onSave, setIsDrawingMode}) => {
  console.log(`DrawTrail Coordinates: ${JSON.stringify(drawTrail)}`);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trailData = {
      timestamp: Date.now(),
      name,
      date,
      phone,
      path: drawTrail,
      notes
    };
    onSave(trailData);
    setIsDrawingMode(false);
  };

  return (
    <div className="trail-form-popup">
      <form onSubmit={handleSubmit}>
        <label className='form-field'>
          Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className='form-field'>
          Date:
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className='form-field'>
          Contact Phone (will not be displayed):
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className='form-field'>
          Notes:
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export default TrailForm;
