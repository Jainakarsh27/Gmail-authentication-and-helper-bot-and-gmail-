import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import * as Notifications from 'expo-notifications';
import axios from 'axios';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BACKEND_URL = 'http://YOUR_LOCAL_IP:8080'; // Replace with actual IP

export default function App() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ name: '', regNo: '' });
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification Clicked:', response);
    });

    fetchEmails();
    const alertInterval = setInterval(checkAlerts, 30000);

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      clearInterval(alertInterval);
    };
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/emails`);
      setEmails(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAlerts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/alerts/check`, {
        params: profile
      });
      if (response.data.length > 0) {
        triggerLocalNotification(response.data[0]);
      }
    } catch (error) {
      console.error("Alert check error:", error);
    }
  };

  const triggerLocalNotification = async (email) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 URGENT EMAIL",
        body: `${email.from}: ${email.subject}`,
        data: { emailId: email.id },
      },
      trigger: null, // immediate
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.emailItem}>
      <Text style={styles.sender}>{item.from}</Text>
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.snippet} numberOfLines={2}>{item.bodySnippet}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>MailSense Mobile</Text>
        <TouchableOpacity onPress={fetchEmails} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#764ba2" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={emails}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No academic emails found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    padding: 20,
    backgroundColor: '#764ba2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  refreshText: { color: 'white' },
  list: { padding: 15 },
  emailItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sender: { fontWeight: 'bold', color: '#4a90e2', fontSize: 14 },
  subject: { fontSize: 16, fontWeight: '600', marginVertical: 5 },
  snippet: { color: '#666', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});
