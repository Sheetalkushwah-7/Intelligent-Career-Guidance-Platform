/**
 * StudentContext.jsx
 * Global context managing student profile, target career, and active tab.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const StudentContext = createContext();

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [allSkills, setAllSkills] = useState([]);
  const [allCareers, setAllCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const refreshProfile = async () => {
    try {
      setLoading(true);
      const res = await api.getProfile();
      setStudent(res.student);
      setAllSkills(res.skills ?? []);
      setAllCareers(res.careers ?? []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const updateSkills = async (answers) => {
    try {
      const res = await api.submitAssessment(answers);
      setStudent(res.student);
      return res;
    } catch (err) {
      console.error('Failed to update skills:', err);
      throw err;
    }
  };

  const updateProfile = async (profile) => {
    const res = await api.updateProfile(profile);
    setStudent(res.student);
    return res.student;
  };

  return (
    <StudentContext.Provider value={{
      student,
      allSkills,
      allCareers,
      loading,
      error,
      activeTab,
      setActiveTab,
      refreshProfile,
      updateSkills,
      updateProfile,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
