import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAdmin} from '../../context/AdminContext';
import NeumorphicCard from '../../components/UI/NeoCard';
import NeumorphicButton from '../../components/UI/NeumorphicButton';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

const AdminDashboardScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {
    dashboardStats,
    categoryAnalytics,
    trendsData,
    loading,
    lastUpdated,
    loadAdminData,
    refreshDashboard,
  } = useAdmin();

  useEffect(() => {
    if (!dashboardStats) {
      loadAdminData();
    }
  }, []);

  const onRefresh = async () => {
    await refreshDashboard();
  };

  const StatCard = ({title, value, subtitle, color, icon, onPress}) => (
    <NeumorphicCard 
      style={[styles.statCard, {borderLeftColor: color, borderLeftWidth: 4}]}
      onPress={onPress}
      pressable={!!onPress}>
      <View style={styles.statContent}>
        <View style={styles.statLeft}>
          <Text style={[styles.statTitle, {color: theme.colors.textSecondary}]}>
            {title}
          </Text>
          <Text style={[styles.statValue, {color: theme.colors.text}]}>
            {value}
          </Text>
          {subtitle && (
            <Text style={[styles.statSubtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
        {icon && (
          <View style={[styles.statIcon, {backgroundColor: color}]}>
            <Icon name={icon} size={24} color="#ffffff" />
          </View>
        )}
      </View>
    </NeumorphicCard>
  );

  const QuickAction = ({title, icon, onPress, color, badge}) => (
    <NeumorphicCard 
      style={[styles.quickActionCard, {borderTopColor: color, borderTopWidth: 3}]}
      onPress={onPress}
      pressable
      animated>
      <View style={styles.quickActionContent}>
        <Icon name={icon} size={28} color={color} />
        <Text style={[styles.quickActionTitle, {color: theme.colors.text}]}>
          {title}
        </Text>
        {badge > 0 && (
          <View style={[styles.badge, {backgroundColor: theme.colors.error}]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge.toString()}
            </Text>
          </View>
        )}
      </View>
    </NeumorphicCard>
  );

  if (loading && !dashboardStats) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <LoadingSpinner text="Loading admin dashboard..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            Admin Dashboard
          </Text>
          {lastUpdated && (
            <Text style={[styles.lastUpdated, {color: theme.colors.textSecondary}]}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Users"
            value={dashboardStats?.total_users || 0}
            subtitle={`${dashboardStats?.new_users_today || 0} new today`}
            color="#6366f1"
            icon="people"
            onPress={() => navigation.navigate('AdminUsers')}
          />
          <StatCard
            title="Active Incidents"
            value={dashboardStats?.active_incidents || 0}
            subtitle={`${dashboardStats?.new_incidents_today || 0} new today`}
            color="#10b981"
            icon="report"
            onPress={() => navigation.navigate('AdminIncidents')}
          />
          <StatCard
            title="Flagged Content"
            value={(dashboardStats?.flagged_incidents || 0) + (dashboardStats?.flagged_comments || 0)}
            subtitle="Needs attention"
            color="#ef4444"
            icon="flag"
            onPress={() => navigation.navigate('AdminIncidents', {flagged: true})}
          />
          <StatCard
            title="Total Comments"
            value={dashboardStats?.total_comments || 0}
            subtitle={`${dashboardStats?.new_comments_today || 0} new today`}
            color="#8b5cf6"
            icon="comment"
            onPress={() => navigation.navigate('AdminComments')}
          />
        </View>

        {/* Category Chart */}
        {categoryAnalytics && categoryAnalytics.length > 0 && (
          <NeumorphicCard style={styles.chartCard}>
            <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
              Incidents by Category
            </Text>
            <PieChart
              data={categoryAnalytics.slice(0, 6).map((cat, index) => ({
                name: cat.category.replace('_', ' '),
                population: cat.count,
                color: getColorForCategory(index),
                legendFontColor: theme.colors.text,
                legendFontSize: 12,
              }))}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                strokeWidth: 2,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </NeumorphicCard>
        )}

        {/* Trends Chart */}
        {trendsData?.daily_incidents && trendsData.daily_incidents.length > 0 && (
          <NeumorphicCard style={styles.chartCard}>
            <Text style={[styles.chartTitle, {color: theme.colors.text}]}>
              Incident Trends (Last 30 Days)
            </Text>
            <LineChart
              data={{
                labels: trendsData.daily_incidents.slice(-7).map(item => 
                  new Date(item.date).toLocaleDateString('en', {month: 'short', day: 'numeric'})
                ),
                datasets: [
                  {
                    data: trendsData.daily_incidents.slice(-7).map(item => item.incidents),
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                labelColor: (opacity = 1) => theme.colors.text,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#6366f1",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </NeumorphicCard>
        )}

        {/* Quick Actions */}
        <NeumorphicCard style={styles.quickActionsCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Manage Users"
              icon="people"
              onPress={() => navigation.navigate('AdminUsers')}
              color="#6366f1"
            />
            <QuickAction
              title="Moderate Content"
              icon="gavel"
              onPress={() => navigation.navigate('AdminIncidents')}
              color="#10b981"
              badge={dashboardStats?.flagged_incidents || 0}
            />
            <QuickAction
              title="Review Comments"
              icon="rate-review"
              onPress={() => navigation.navigate('AdminComments')}
              color="#f59e0b"
              badge={dashboardStats?.flagged_comments || 0}
            />
            <QuickAction
              title="View Analytics"
              icon="analytics"
              onPress={() => navigation.navigate('AdminAnalytics')}
              color="#8b5cf6"
            />
            <QuickAction
              title="Generate Reports"
              icon="assessment"
              onPress={() => navigation.navigate('AdminReports')}
              color="#06b6d4"
            />
            <QuickAction
              title="System Settings"
              icon="settings"
              onPress={() => navigation.navigate('AdminSettings')}
              color="#64748b"
            />
          </View>
        </NeumorphicCard>

        {/* System Status */}
        <NeumorphicCard style={styles.statusCard}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            System Status
          </Text>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, {backgroundColor: '#10b981'}]} />
            <Text style={[styles.statusText, {color: theme.colors.text}]}>
              All systems operational
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator, 
              {backgroundColor: dashboardStats?.flagged_incidents > 0 ? '#f59e0b' : '#10b981'}
            ]} />
            <Text style={[styles.statusText, {color: theme.colors.text}]}>
              {dashboardStats?.flagged_incidents || 0} flagged incidents
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[
              styles.statusIndicator, 
              {backgroundColor: dashboardStats?.flagged_comments > 0 ? '#f59e0b' : '#10b981'}
            ]} />
            <Text style={[styles.statusText, {color: theme.colors.text}]}>
              {dashboardStats?.flagged_comments || 0} flagged comments
            </Text>
          </View>
        </NeumorphicCard>
      </ScrollView>
    </View>
  );
};

const getColorForCategory = (index) => {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLeft: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCard: {
    margin: 20,
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsCard: {
    margin: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    marginBottom: 12,
    padding: 16,
    position: 'relative',
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCard: {
    margin: 20,
    padding: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
  },
});

export default AdminDashboardScreen;
