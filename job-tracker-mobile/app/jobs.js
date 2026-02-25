import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function JobsScreen() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchJobs = async () => {
        try {
            const res = await api.get('/jobs');
            setJobs(res.data);
        } catch (error) {
            console.warn('Error fetching jobs:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchJobs();
        setRefreshing(false);
    }, []);

    if (loading) {
        return (
            <StyledView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563eb" />
            </StyledView>
        );
    }

    const renderJob = ({ item }) => (
        <StyledTouchableOpacity
            className="bg-white p-4 mx-4 mb-3 rounded-xl shadow-sm border border-gray-100 flex-row justify-between items-center"
            // In a real app, router.push(\`/jobs/\${item.id}\`) would go here
            activeOpacity={0.7}
        >
            <StyledView className="flex-1 pr-3">
                <StyledText className="text-lg font-bold text-gray-900 mb-1">{item.company}</StyledText>
                <StyledText className="text-gray-500 mb-2">{item.position}</StyledText>

                <StyledView className="flex-row items-center mt-1">
                    {item.location && <StyledText className="text-xs text-gray-400 mr-2">📍 {item.location}</StyledText>}
                    {item.remote === 1 && <StyledText className="text-xs text-gray-400 mr-2">🏠 Remote</StyledText>}
                </StyledView>
            </StyledView>

            <StyledView className="items-end h-full justify-between pb-1">
                <StatusBadge status={item.status} />
                {item.deadline && (
                    <StyledText className="text-xs text-red-500 font-medium mt-3">Due: {item.deadline}</StyledText>
                )}
            </StyledView>
        </StyledTouchableOpacity>
    );

    return (
        <StyledView className="flex-1 bg-gray-50 pt-4">
            <FlatList
                data={jobs}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderJob}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <StyledView className="items-center justify-center py-10">
                        <StyledText className="text-gray-400 text-lg">No jobs tracked yet.</StyledText>
                    </StyledView>
                }
            />
        </StyledView>
    );
}
