import React from 'react';

export interface MoveCardProps {
  name: string;
  level: number;
  info?: {
    description: string;
    type: string;
    pp: number;
    power: number;
    category: string;
  };
}

const MoveCard: React.FC<MoveCardProps> = ({ name, level, info }) => (
  <li className="border rounded p-2">
    <div className="font-bold">{name} <span className="text-gray-500">(Lv. {level})</span></div>
    {info ? (
      <div className="text-sm text-gray-700 mt-1">
        <div><span className="font-semibold">Type:</span> {info.type}</div>
        <div><span className="font-semibold">Category:</span> {info.category}</div>
        <div><span className="font-semibold">Power:</span> {info.power}</div>
        <div><span className="font-semibold">PP:</span> {info.pp}</div>
        <div className="mt-1">{info.description}</div>
      </div>
    ) : (
      <div className="text-red-500 text-sm mt-1">No description found.</div>
    )}
  </li>
);

export default MoveCard;
