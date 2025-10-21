import React from 'react';
import { 
  View, 
  Text, 
  ImageBackground, 
  ScrollView, 
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { BriefcaseBusiness, Camera, Cloud, Clock, Map, Users } from 'lucide-react-native';

const heroImage = require('../../assets/hero.jpg');
 
const HomeScreen: React.FC = () => {
  const features = [
    { icon: <BriefcaseBusiness size={32} color="#B45309" />, title: 'Discover Artifacts', description: 'Upload and identify artifacts using AI technology' },
    { icon: <Camera size={32} color="#B45309" />, title: 'AR Experience', description: 'Experience artifacts in their historical context' },
    { icon: <Cloud size={32} color="#B45309" />, title: 'Climate Impact', description: 'Analyze environmental effects on artifacts' },
    { icon: <Clock size={32} color="#B45309" />, title: 'Restoration', description: 'AI-powered restoration suggestions' },
    { icon: <Map size={32} color="#B45309" />, title: 'Cultural Mapping', description: 'Explore cultural evolution through time' },
    { icon: <Users size={32} color="#B45309" />, title: 'Community', description: 'Connect with experts and enthusiasts' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ImageBackground 
          source={heroImage}
          style={styles.hero}
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>Preserving Heritage Through AI</Text>
            <Text style={styles.subtitle}>Discover, analyze, and preserve cultural artifacts</Text>
          </View>
        </ImageBackground>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              {feature.icon}
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FAF7F2' 
  },
  hero: { 
    height: 400, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  overlay: { 
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    padding: 20, 
    borderRadius: 10 
  },
  title: { 
    fontSize: 28, 
    color: 'white', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 16, 
    color: 'white', 
    textAlign: 'center', 
    marginVertical: 10 
  },
  featuresContainer: { 
    padding: 20 
  },
  featureCard: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10, 
    alignItems: 'center', 
    elevation: 3 
  },
  featureTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#444' 
  },
  featureDescription: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center', 
    marginTop: 5 
  }
});

export default HomeScreen;
