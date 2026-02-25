import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

const STYLES = {
    applied: 'bg-blue-100 text-blue-800',
    phone_screen: 'bg-indigo-100 text-indigo-800',
    oa: 'bg-yellow-100 text-yellow-800',
    technical: 'bg-orange-100 text-orange-800',
    onsite: 'bg-pink-100 text-pink-800',
    offer: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    withdrawn: 'bg-gray-100 text-gray-800',
};

export const STATUS_LABELS = {
    applied: 'Applied',
    phone_screen: 'Phone',
    oa: 'OA',
    technical: 'Technical',
    onsite: 'Onsite',
    offer: 'Offer 🎉',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
};

export default function StatusBadge({ status }) {
    const styleString = STYLES[status] || 'bg-gray-100 text-gray-800';
    const bgClass = styleString.split(' ')[0];
    const textClass = styleString.split(' ')[1];

    return (
        <StyledView className={`px-2 py-1 rounded-full ${bgClass} self-start`}>
            <StyledText className={`text-xs font-semibold ${textClass}`}>
                {STATUS_LABELS[status] || status}
            </StyledText>
        </StyledView>
    );
}
