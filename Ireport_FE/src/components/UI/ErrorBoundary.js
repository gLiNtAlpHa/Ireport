import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import NeumorphicButton from './NeoButton';
import NeumorphicCard from './NeoCard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({hasError: false, error: null});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <NeumorphicCard style={styles.errorCard}>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            <NeumorphicButton
              title="Try Again"
              onPress={this.handleRetry}
              style={styles.retryButton}
            />
          </NeumorphicCard>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorCard: {
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1e293b',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    color: '#64748b',
  },
  retryButton: {
    marginTop: 8,
  },
});

export default ErrorBoundary;
