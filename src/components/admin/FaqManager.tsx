// src/components/admin/FaqManager.tsx (Example Path)

"use client";

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { RootState, AppDispatch } from '@/lib/store/store';
import {
    updateFaqsLocally,
} from '@/lib/slices/restaurantSlice';
import apiClient from '@/lib/apiClient';
import type { FAQItem } from '@/constants/types';

// --- Icons (Updated Size) ---
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const EditIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const DeleteIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const SaveIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CancelIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const SpinnerIcon: React.FC<{className?: string}> = ({ className = "animate-spin h-5 w-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );


const FaqManager: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const initialFaqs = useSelector(((state:RootState) => state.restaurant.info?.faqs));
    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

    const [faqs, setFaqs] = useState<FAQItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ question: string; answer: string }>({ question: '', answer: '' });
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setFaqs(initialFaqs ? JSON.parse(JSON.stringify(initialFaqs)) : []);
    }, [initialFaqs]);

    const handleAddClick = () => {
        setEditingId(null);
        setEditData({ question: '', answer: '' });
        setIsAdding(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleEditClick = (faq: FAQItem) => {
        setIsAdding(false);
        setEditingId(faq.id);
        setEditData({ question: faq.question, answer: faq.answer });
        setError(null);
        setSuccessMessage(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setEditData({ question: '', answer: '' });
        setError(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = (idToSave: string) => {
        if (!editData.question.trim() || !editData.answer.trim()) {
            setError("Question and Answer cannot be empty.");
            return;
        }
        setFaqs(prevFaqs =>
            prevFaqs.map(faq =>
                faq.id === idToSave ? { ...faq, ...editData } : faq
            )
        );
        handleCancelEdit();
    };

    const handleAddNew = () => {
        if (!editData.question.trim() || !editData.answer.trim()) {
            setError("Question and Answer cannot be empty.");
            return;
        }
        const newFaq: FAQItem = {
            id: uuidv4(),
            question: editData.question.trim(),
            answer: editData.answer.trim(),
        };
        setFaqs(prevFaqs => [...prevFaqs, newFaq]);
        handleCancelEdit();
    };

    const handleDelete = (idToDelete: string) => {
        if (window.confirm("Are you sure you want to delete this FAQ?")) {
            setFaqs(prevFaqs => prevFaqs.filter(faq => faq.id !== idToDelete));
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleSaveChanges = async () => {
        if (!restaurantId) {
            setError("Restaurant ID not configured.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await apiClient.put(`/admin/restaurants/${restaurantId}/faqs`, { faqs: faqs });
            dispatch(updateFaqsLocally(faqs));
            setSuccessMessage("FAQs saved successfully!");
        } catch (err: any) {
             console.error("Error saving FAQs:", err);
             setError(err.response?.data?.message || err.message || "Failed to save FAQs.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Dark Mode Styles ---
    const inputFieldDarkStyle: string = "block w-full px-3.5 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#B41219] focus:border-[#B41219] sm:text-sm placeholder-gray-400 transition-all duration-150 ease-in-out hover:border-[#B41219]/50 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-400";
    const iconButtonBaseStyle: string = "p-2 rounded-md transition-colors duration-150 flex items-center justify-center";


    return (
        <div className="space-y-6 rounded-xl shadow-2xl max-w-3xl mx-auto my-8">
            <AnimatePresence>
                {faqs.map((faq) => (
                    <motion.div
                        key={faq.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border border-primary rounded-lg p-4 bg-white/5 shadow-md"
                    >
                        {editingId === faq.id ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    name="question"
                                    value={editData.question}
                                    onChange={handleInputChange}
                                    placeholder="Question"
                                    className={inputFieldDarkStyle}
                                />
                                <textarea
                                    name="answer"
                                    value={editData.answer}
                                    onChange={handleInputChange}
                                    placeholder="Answer"
                                    rows={3}
                                    className={inputFieldDarkStyle}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={handleCancelEdit} className={`${iconButtonBaseStyle} text-gray-400 hover:text-gray-200 hover:bg-gray-700`} aria-label="Cancel edit"><CancelIcon /></button>
                                    <button onClick={() => handleSaveEdit(faq.id)} className={`${iconButtonBaseStyle} text-green-400 hover:text-green-300 hover:bg-green-500/20`} aria-label="Save edit"><SaveIcon /></button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex-grow">
                                    <p className="font-semibold text-gray-100">{faq.question}</p>
                                    <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">{faq.answer}</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => handleEditClick(faq)} className={`${iconButtonBaseStyle} text-blue-400 hover:text-blue-300 hover:bg-blue-500/20`} aria-label="Edit FAQ"><EditIcon /></button>
                                    <button onClick={() => handleDelete(faq.id)} className={`${iconButtonBaseStyle} text-red-400 hover:text-red-300 hover:bg-red-500/20`} aria-label="Delete FAQ"><DeleteIcon /></button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {isAdding && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }} // Ensure margin when it appears
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-md space-y-3"
                >
                    <h4 className="text-lg font-semibold text-gray-200">Add New FAQ</h4>
                    <input
                        type="text"
                        name="question"
                        value={editData.question}
                        onChange={handleInputChange}
                        placeholder="Question"
                        className={inputFieldDarkStyle}
                    />
                    <textarea
                        name="answer"
                        value={editData.answer}
                        onChange={handleInputChange}
                        placeholder="Answer"
                        rows={3}
                        className={inputFieldDarkStyle}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleCancelEdit} className={`${iconButtonBaseStyle} text-gray-400 hover:text-gray-200 hover:bg-gray-700`} aria-label="Cancel add"><CancelIcon /></button>
                        <button onClick={handleAddNew} className={`${iconButtonBaseStyle} text-green-400 hover:text-green-300 hover:bg-green-500/20`} aria-label="Save new FAQ"><SaveIcon /></button>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-700 gap-4">
                <button
                    onClick={handleAddClick}
                    disabled={isAdding || editingId !== null}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto transition-colors duration-150"
                >
                    <PlusIcon /> Add FAQ
                </button>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {error && <p className="text-sm text-red-400 flex-grow text-center sm:text-left">{error}</p>}
                    {successMessage && <p className="text-sm text-green-400 flex-grow text-center sm:text-left">{successMessage}</p>}
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading || isAdding || editingId !== null}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-[#B41219] hover:bg-[#9A080F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[#B41219] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto transition-colors duration-150"
                    >
                        {isLoading ? <SpinnerIcon className="animate-spin h-5 w-5 mr-2 text-white" /> : null}
                        {isLoading ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaqManager;