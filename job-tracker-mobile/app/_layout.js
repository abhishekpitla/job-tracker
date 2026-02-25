import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Layout() {
    return (
        <Tabs screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: '#2563eb', // blue-600
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Jobs',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="briefcase" size={24} color={color} />
                }}
            />
            <Tabs.Screen
                name="prep"
                options={{
                    title: 'Prep',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cards" size={24} color={color} />
                }}
            />
        </Tabs>
    );
}
