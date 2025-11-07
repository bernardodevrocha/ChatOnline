import React from 'react';

export default function Icon({ name, size=20 }){
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch(name){
    case 'mic':
      return (
        <svg {...common}><path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Z"/><path d="M19 10a7 7 0 0 1-14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
      );
    case 'mic-off':
      return (
        <svg {...common}><path d="M9 9v1a3 3 0 0 0 5.12 2.12"/><path d="M15 9V6a3 3 0 0 0-5.98-.5"/><path d="M19 10a7 7 0 0 1-12.4 4.2"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      );
    case 'video':
      return (
        <svg {...common}><rect x="3" y="7" width="13" height="10" rx="2"/><polygon points="22 7 16 12 22 17 22 7"/></svg>
      );
    case 'video-off':
      return (
        <svg {...common}><path d="M16 16H5a2 2 0 0 1-2-2V8"/><path d="M16 8v8"/><path d="M22 8l-6 4 6 4V8z"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      );
    case 'send':
      return (
        <svg {...common}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      );
    case 'share':
      return (
        <svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      );
    case 'trash':
      return (
        <svg {...common}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
      );
    case 'edit':
      return (<svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>);
    default:
      return null;
  }
}

