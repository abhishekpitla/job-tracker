import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import api from '../utils/api';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/stats');
            setStats(res.data);
        } catch (error) {
            console.warn('Error fetching stats:', error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, []);

    if (loading) {
        return (
            <StyledView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563eb" />
            </StyledView>
        );
    }

    if (!stats) {
        return (
            <StyledView className="flex-1 items-center justify-center bg-gray-50">
                <StyledText className="text-gray-500">Failed to load dashboard data.</StyledText>
            </StyledView>
        );
    }

    const sm = Object.fromEntries(stats.byStatus.map(s => [s.status, s.count]));
    const active = ['applied', 'phone_screen', 'oa', 'technical', 'onsite'].reduce((sum, s) => sum + (sm[s] || 0), 0);

    return (
        <StyledScrollView
            className="flex-1 bg-gray-50 px-4 pt-6"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <StyledView className="mb-6">
                <StyledText className="text-2xl font-bold text-gray-900">Dashboard</StyledText>
                <StyledText className="text-gray-500 mt-1">Your job search at a glance</StyledText>
            </StyledView>

            {/* Stats Grid */}
            <StyledView className="flex-row flex-wrap justify-between">
                <StatCard label="Total Applied" value={stats.total} icon="📋" bgColor="bg-blue-50" textColor="text-blue-600" />
                <StatCard label="In Progress" value={active} icon="⚡" bgColor="bg-yellow-50" textColor="text-yellow-600" />
                <StatCard label="Offers" value={sm.offer || 0} icon="🎉" bgColor="bg-green-50" textColor="text-green-600" />
                <StatCard label="Rejected" value={sm.rejected || 0} icon="❌" bgColor="bg-red-50" textColor="text-red-500" />
            </StyledView>

            {/* Upcoming */}
            <StyledView className="mt-6 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <StyledText className="text-lg font-bold text-gray-900 mb-4">⏰ Upcoming Deadlines</StyledText>
                {stats.upcoming.length === 0 ? (
                    <StyledText className="text-gray-400">No upcoming deadlines 🎉</StyledText>
                ) : (
                    stats.upcoming.map(job => (
                        <StyledView key={job.id} className="flex-row justify-between items-center py-2 border-b border-gray-50">
                            <StyledText className="font-medium text-blue-600 truncate flex-1 pr-2" numberOfLines={1}>
                                {job.company} — {job.position}
                            </StyledText>
                            <StyledText className="text-red-500 font-medium text-xs">{job.deadline}</StyledText>
                        </StyledView>
                    ))
                )}
            </StyledView>
            <StyledView className="h-10" />
        </StyledScrollView>
    );
}

function StatCard({ label, value, icon, bgColor, textColor }) {
    return (
        <StyledView className={`w-[48%] p-4 rounded-xl mb-4 ${bgColor}`}>
            <StyledText className="text-2xl mb-1">{icon}</StyledText>
            <StyledText className={`text-3xl font-bold ${textColor}`}>{value}</StyledText>
            <StyledText className="text-xs text-gray-500 font-medium mt-1">{label}</StyledText>
        </StyledView>
    );
}
