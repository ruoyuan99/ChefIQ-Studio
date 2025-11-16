import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChefIQChallengeScreenProps {
  navigation: any;
}

const ChefIQChallengeScreen: React.FC<ChefIQChallengeScreenProps> = ({ navigation }) => {
  const handleBuyMiniOven = () => {
    const url = 'https://chefiq.com/products/iq-minioven';
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const handleParticipate = () => {
    // Navigate to Create Recipe screen with challenge mode enabled
    navigation.navigate('CreateRecipe', {
      fromChallenge: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#d96709" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chef iQ Challenge</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.trophyContainer}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Chef iQ Challenge</Text>
          <Text style={styles.heroSubtitle}>Showcase Your Culinary Creativity</Text>
          <Text style={styles.heroDescription}>
            Create amazing recipes using the iQ MiniOven and compete for amazing prizes!
          </Text>
        </View>

        {/* Challenge Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Overview</Text>
          <Text style={styles.sectionText}>
            The Chef iQ Challenge is a cooking competition where home chefs create and share their best recipes using the iQ MiniOven. 
            Show off your culinary skills, get creative with the MiniOven's 11 cooking functions, and compete for recognition and prizes!
          </Text>
        </View>

        {/* Mini Oven Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cook with iQ MiniOven</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="flash" size={24} color="#d96709" />
              <Text style={styles.featureTitle}>11 Functions</Text>
              <Text style={styles.featureText}>Bake, roast, air fry, and more</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="speedometer" size={24} color="#d96709" />
              <Text style={styles.featureTitle}>3200 RPM</Text>
              <Text style={styles.featureText}>DC motor for faster cooking</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="phone-portrait" size={24} color="#d96709" />
              <Text style={styles.featureTitle}>App Control</Text>
              <Text style={styles.featureText}>Remote monitoring & control</Text>
            </View>
            <View style={styles.featureCard}>
              <Ionicons name="thermometer" size={24} color="#d96709" />
              <Text style={styles.featureTitle}>500°F Max</Text>
              <Text style={styles.featureText}>High-temperature cooking</Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Your iQ MiniOven</Text>
                <Text style={styles.stepDescription}>
                  Purchase the iQ MiniOven and use your discount code for special pricing
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create Your Recipe</Text>
                <Text style={styles.stepDescription}>
                  Use the MiniOven's 11 cooking functions to create an amazing dish
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Share Your Creation</Text>
                <Text style={styles.stepDescription}>
                  Upload your recipe with photos and cooking details to the challenge
                </Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Win Prizes</Text>
                <Text style={styles.stepDescription}>
                  The best recipes are selected by judges and community votes
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prizes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prizes & Rewards</Text>
          <View style={styles.prizesContainer}>
            <View style={styles.prizeCard}>
              <View style={styles.prizeIcon}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
              </View>
              <Text style={styles.prizeTitle}>1st Place</Text>
              <Text style={styles.prizeDescription}>
                • $500 Cash Prize{'\n'}
                • Featured on CHEF iQ App{'\n'}
                • Premium Kitchen Set
              </Text>
            </View>
            <View style={styles.prizeCard}>
              <View style={styles.prizeIcon}>
                <Ionicons name="medal" size={32} color="#C0C0C0" />
              </View>
              <Text style={styles.prizeTitle}>2nd Place</Text>
              <Text style={styles.prizeDescription}>
                • $300 Cash Prize{'\n'}
                • Featured Recipe{'\n'}
                • CHEF iQ Accessories
              </Text>
            </View>
            <View style={styles.prizeCard}>
              <View style={styles.prizeIcon}>
                <Ionicons name="medal-outline" size={32} color="#CD7F32" />
              </View>
              <Text style={styles.prizeTitle}>3rd Place</Text>
              <Text style={styles.prizeDescription}>
                • $200 Cash Prize{'\n'}
                • Recipe Spotlight{'\n'}
                • CHEF iQ Merchandise
              </Text>
            </View>
          </View>
        </View>

        {/* Rules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Challenge Rules</Text>
          <View style={styles.rulesList}>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Recipes must be created using the iQ MiniOven
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Include high-quality photos of your dish
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Provide detailed recipe instructions and cooking settings
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Original recipes only (no duplicates or copied content)
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                Submissions must be received by the deadline
              </Text>
            </View>
            <View style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.ruleText}>
                One entry per participant
              </Text>
            </View>
          </View>
        </View>

        {/* Discount Code Section */}
        <View style={styles.discountSection}>
          <View style={styles.discountCard}>
            <Ionicons name="pricetag" size={40} color="#d96709" />
            <Text style={styles.discountTitle}>Special Discount</Text>
            <Text style={styles.discountDescription}>
              Get your iQ MiniOven at a special price for challenge participants!
            </Text>
            <Text style={styles.discountPrice}>
              Regular: $599.99 → Sale: $499.99
            </Text>
            <TouchableOpacity
              style={styles.discountButton}
              onPress={handleBuyMiniOven}
            >
              <Text style={styles.discountButtonText}>Buy iQ MiniOven</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.discountNote}>
              Use code: CHALLENGE2025 at checkout
            </Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleParticipate}
            activeOpacity={0.8}
          >
            <View style={styles.ctaButtonContent}>
              <Ionicons name="trophy" size={24} color="#fff" />
              <Text style={styles.ctaButtonText}>Participate Now</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.ctaNote}>
            Join the challenge and showcase your culinary creativity!
          </Text>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Questions? Contact us at support@chefiq.com
          </Text>
          <Text style={styles.footerText}>
            Challenge ends: TBD
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24),
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#d96709',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#d96709',
    marginHorizontal: 0,
  },
  trophyContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: '2%',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stepsContainer: {
    marginTop: 8,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d96709',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  prizesContainer: {
    marginTop: 8,
  },
  prizeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d96709',
  },
  prizeIcon: {
    marginBottom: 12,
  },
  prizeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  prizeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  rulesList: {
    marginTop: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ruleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  discountSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  discountCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d96709',
    borderStyle: 'dashed',
  },
  discountTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  discountDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d96709',
    marginBottom: 20,
  },
  discountButton: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#d96709',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  discountNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  ctaSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#d96709',
    overflow: 'hidden',
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  ctaNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default ChefIQChallengeScreen;

