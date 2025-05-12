'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpDown } from 'lucide-react';
import { Patient } from '@/lib/types';
import { useStore } from '@/lib/store';

export function PatientList() {
  const router = useRouter();
  const { patients } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'risk' | 'conditions' | 'hcpcs'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredPatients = Object.entries(patients).filter(([_, patient]) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPatients = [...filteredPatients].sort(([_, a], [__, b]) => {
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'risk') {
      const riskA = a.conditions.length;
      const riskB = b.conditions.length;
      return sortDirection === 'asc' ? riskA - riskB : riskB - riskA;
    } else if (sortField === 'conditions') {
      const conditionsA = a.conditions.length;
      const conditionsB = b.conditions.length;
      return sortDirection === 'asc' ? conditionsA - conditionsB : conditionsB - conditionsA;
    } else if (sortField === 'hcpcs') {
      return sortDirection === 'asc'
        ? a.hcpcs_code.localeCompare(b.hcpcs_code)
        : b.hcpcs_code.localeCompare(a.hcpcs_code);
    }
    return 0;
  });

  const handleSort = (field: 'name' | 'risk' | 'conditions' | 'hcpcs') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 font-medium text-gray-500 cursor-pointer"
                >
                  <span>Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('risk')}
                  className="flex items-center space-x-1 font-medium text-gray-500 cursor-pointer"
                >
                  <span>Compliance Risk</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('conditions')}
                  className="flex items-center space-x-1 font-medium text-gray-500 cursor-pointer"
                >
                  <span>Conditions</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('hcpcs')}
                  className="flex items-center space-x-1 font-medium text-gray-500 cursor-pointer"
                >
                  <span>HCPCS Code</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Flags/Alerts</th>
            </tr>
          </thead>
          <tbody>
            {sortedPatients.map(([id, patient]) => (
              <tr
                key={id}
                className="cursor-pointer border-b hover:bg-gray-50"
                onClick={() => router.push(`/patients/${id}`)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-black">{patient.name}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      patient.conditions.length > 2
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {patient.conditions.length > 2 ? 'High Risk' : 'Low Risk'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.map((condition, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-black">{patient.hcpcs_code}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-500">No active flags</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 