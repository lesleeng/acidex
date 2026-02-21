import { Image } from 'expo-image';
import { StyleSheet, Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';

// Custom components
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Color constants
const LIGHT_BG = '#F5F5F5';
const DARK_COFFEE = '#3C2C24';
const TAN_BUTTON = '#D4AF7A';
const PLACEHOLDER_GRAY = '#D3D3D3';
const TEXT_DARK = '#1D1D1D';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45;

export default function HomeScreen() {
  const userName = 'Alice';

  // Coffee card helper component
  const CoffeeCard = ({ name }: { name: string }) => (
    <ThemedView style={styles.smallCard}>
      <Image
        source={require('../../assets/images/icon.png')}
        style={styles.coffeeImage}
        contentFit="contain"
      />
      <ThemedText style={styles.smallCardText}>{name}</ThemedText>
    </ThemedView>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: LIGHT_BG, dark: TEXT_DARK }}
      headerImage={
        <View style={styles.customHeader}>
          {/* Left Icon */}
          <Image
            source={require('../../assets/images/icon.png')}
            style={styles.headerIcon}
            contentFit="contain"
          />

          {/* Middle text, centered */}
          <View style={styles.headerMiddle}>
            <ThemedText style={styles.acidexText}>acidex.</ThemedText>
            <ThemedText style={styles.analyzerText}>your coffee analyzer</ThemedText>
          </View>

          {/* Right avatar */}
          <View style={styles.avatarPlaceholder} />
        </View>
      }
    >
      <ThemedView style={styles.container}>
        {/* Dark Coffee Analyzer Card */}
        <ThemedView style={styles.darkCard}>
          <ThemedView style={styles.largeImagePlaceholder} />

          <ThemedText style={styles.greetingText}>good morning, [{userName}].</ThemedText>

          <TouchableOpacity style={styles.analyzeButton} onPress={() => console.log('Analyze coffee pressed')}>
            <ThemedText style={styles.analyzeButtonText}>analyze your coffee</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Did You Know Section */}
        <ThemedText style={styles.didYouKnowText}>did you know?</ThemedText>

        {/* Horizontal Coffee Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          <CoffeeCard name="americano" />
          <CoffeeCard name="americano" />
          <CoffeeCard name="americano" />
          <CoffeeCard name="espresso" />
          <CoffeeCard name="latte" />
        </ScrollView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    backgroundColor: LIGHT_BG,
  },

  // --- Custom Header ---
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: LIGHT_BG,
  },
  headerIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerMiddle: {
    flex: 1,
    alignItems: 'center',
  },
  acidexText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: DARK_COFFEE,
    lineHeight: 20,
    textAlign: 'center',
  },
  analyzerText: {
    fontSize: 12,
    color: DARK_COFFEE,
    opacity: 0.6,
    textAlign: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DARK_COFFEE,
  },

  // --- Dark Card ---
  darkCard: {
    backgroundColor: DARK_COFFEE,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  largeImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: PLACEHOLDER_GRAY,
    borderRadius: 10,
    marginBottom: 16,
    maxWidth: 200,
  },
  greetingText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  analyzeButton: {
    backgroundColor: TAN_BUTTON,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  analyzeButtonText: {
    color: DARK_COFFEE,
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'lowercase',
  },

  // --- Did You Know Section ---
  didYouKnowText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 16,
    textAlign: 'center',
  },

  // --- Horizontal Coffee Cards ---
  horizontalScrollContent: {
    paddingRight: 16,
    paddingBottom: 20,
  },
  smallCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    backgroundColor: 'white',
    borderRadius: 15,
    marginRight: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  coffeeImage: {
    width: '90%',
    height: '75%',
    marginBottom: 5,
  },
  smallCardText: {
    color: DARK_COFFEE,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
