import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import api from '../utils/api';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function PrepScreen() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchPrep = async () => {
        try {
            setLoading(true);
            const res = await api.get('/prep');
            // Shuffle array logic
            const shuffled = res.data.sort(() => 0.5 - Math.random());
            setQuestions(shuffled);
            setCurrentIndex(0);
            setShowAnswer(false);
        } catch (error) {
            console.warn('Error fetching prep data:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrep();
    }, []);

    const handleNext = (outcome) => {
        // We could log outcome to backend here like on Web
        if (currentIndex < questions.length - 1) {
            setShowAnswer(false);
            setCurrentIndex(curr => curr + 1);
        } else {
            // Completed deck
            fetchPrep(); // just restart for now
        }
    };

    if (loading) {
        return (
            <StyledView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#7c3aed" />
            </StyledView>
        );
    }

    if (questions.length === 0) {
        return (
            <StyledView className="flex-1 items-center justify-center bg-gray-50">
                <StyledText className="text-gray-400">No questions available.</StyledText>
            </StyledView>
        );
    }

    const currentQ = questions[currentIndex];

    return (
        <StyledView className="flex-1 bg-gray-50 p-6 pt-10 items-center justify-center">
            <StyledText className="text-gray-400 font-medium mb-6">
                Card {currentIndex + 1} / {questions.length}
            </StyledText>

            {/* Flashcard */}
            <StyledTouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowAnswer(!showAnswer)}
                className="w-full bg-white rounded-3xl p-8 shadow-md border-b-4 border-gray-200 min-h-[350px] justify-center items-center"
            >
                <StyledView className="absolute top-4 left-4 bg-violet-100 px-3 py-1 rounded-full">
                    <StyledText className="text-violet-800 text-xs font-bold">{currentQ.category}</StyledText>
                </StyledView>

                {currentQ.difficulty && (
                    <StyledView className="absolute top-4 right-4 bg-gray-100 px-2 py-1 rounded-md">
                        <StyledText className="text-gray-500 text-xs font-medium uppercase">{currentQ.difficulty}</StyledText>
                    </StyledView>
                )}

                {!showAnswer ? (
                    <StyledText className="text-2xl font-bold text-center text-gray-900 mt-4">
                        {currentQ.question}
                    </StyledText>
                ) : (
                    <StyledView className="w-full">
                        <StyledText className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">
                            Answer
                        </StyledText>
                        <StyledText className="text-lg text-gray-700 text-center leading-relaxed">
                            {currentQ.answer}
                        </StyledText>
                    </StyledView>
                )}

                <StyledText className="absolute bottom-6 text-gray-300 text-sm font-medium">
                    Tap to flip
                </StyledText>
            </StyledTouchableOpacity>

            {/* Controls */}
            {showAnswer && (
                <StyledView className="w-full flex-row justify-between mt-10 px-2 space-x-4">
                    <StyledTouchableOpacity
                        onPress={() => handleNext('know')}
                        className="flex-1 bg-green-500 py-4 rounded-xl shadow-sm items-center mr-2"
                    >
                        <StyledText className="text-white font-bold text-lg">Got It</StyledText>
                    </StyledTouchableOpacity>

                    <StyledTouchableOpacity
                        onPress={() => handleNext('skip')}
                        className="flex-1 bg-yellow-500 py-4 rounded-xl shadow-sm items-center ml-2"
                    >
                        <StyledText className="text-white font-bold text-lg">Skip</StyledText>
                    </StyledTouchableOpacity>
                </StyledView>
            )}
        </StyledView>
    );
}
