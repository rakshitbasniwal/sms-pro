import React from 'react';

const Placeholder = ({ title }) => {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="card">
        <p>This module is currently under development.</p>
      </div>
    </div>
  );
};

export default Placeholder;
