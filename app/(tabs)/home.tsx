import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

// carousel sizing
const CARD_WIDTH = width * 0.62;
const CARD_GAP = 16;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;
const SIDE_SPACING = (width - CARD_WIDTH) / 2;

const DEFAULT_AVATARS = [
  require("../../assets/images/avatars/avatar1.png"),
  require("../../assets/images/avatars/avatar2.png"),
  require("../../assets/images/avatars/avatar3.png"),
  require("../../assets/images/avatars/avatar4.png"),
];

const factsData = [
  {
    id: 1,
    image: require("../../assets/images/fact-1.png"),
    shortFact:
      "Coffee naturally contains acids that affect both flavor and digestion.",
    title: "Coffee naturally contains acids",
    fullText:
      "Coffee contains natural compounds such as chlorogenic acids, quinic acid, and citric acid. These acids contribute to coffee’s bright, tangy, or fruity taste depending on the roast and brewing method. Light roasts usually retain more of these acids, while darker roasts often taste less acidic. Some of these compounds, especially chlorogenic acids, are also known for their antioxidant properties.",
    suggestion:
      "Acidity is not always bad—it also helps create coffee’s flavor profile.",
    references: [
      "Farah, A. (2012). Coffee Constituents. Royal Society of Chemistry.",
      "NIH – National Library of Medicine: Chlorogenic acid studies.",
      "Specialty Coffee Association (SCA).",
    ],
  },
  {
    id: 2,
    image: require("../../assets/images/fact-2.png"),
    shortFact:
      "Highly acidic coffee may trigger heartburn or stomach discomfort in sensitive people.",
    title: "Acidic coffee can cause discomfort",
    fullText:
      "Coffee can stimulate stomach acid production. In some individuals, especially those with sensitive digestion, this may lead to symptoms such as heartburn, acid reflux, or mild stomach discomfort. Caffeine may also relax the lower esophageal sphincter, making it easier for stomach acid to rise into the esophagus.",
    suggestion:
      "If coffee upsets your stomach, try drinking it after meals or choosing low-acid options.",
    references: [
      "American College of Gastroenterology.",
      "Harvard Health Publishing – Coffee and GERD.",
      "NIDDK (National Institute of Diabetes and Digestive and Kidney Diseases).",
    ],
  },
  {
    id: 3,
    image: require("../../assets/images/fact-3.png"),
    shortFact: "Cold brew is often less acidic than hot brewed coffee.",
    title: "Cold brew is usually less acidic",
    fullText:
      "Cold brew coffee is made by steeping grounds in cold water for several hours. Because the extraction happens at a lower temperature, fewer acidic compounds are pulled out compared to hot brewing methods. This is why cold brew often tastes smoother and may feel gentler on the stomach for some drinkers.",
    suggestion:
      "Cold brew may be a better choice if you want a smoother, lower-acid coffee experience.",
    references: [
      "Rao, N. Z., & Fuller, M. (2018). Acidity and antioxidant activity of cold brew coffee.",
      "Scientific Reports.",
      "Coffee chemistry studies on brew temperature and acid extraction.",
    ],
  },
  {
    id: 4,
    image: require("../../assets/images/fact-4.png"),
    shortFact:
      "Acidic coffee may irritate the stomach lining in some people.",
    title: "Coffee may irritate the stomach lining",
    fullText:
      "For some people, coffee can worsen stomach irritation, especially if they already have gastritis, reflux, or a sensitive stomach. This is not caused by acidity alone—caffeine and other compounds in coffee may also contribute. Tolerance varies from person to person, so one person may feel fine while another experiences discomfort after a single cup.",
    suggestion:
      "Pay attention to your own body’s response—personal tolerance matters most.",
    references: [
      "National Institutes of Health (NIH).",
      "Mayo Clinic – Gastritis and diet guidance.",
      "World Journal of Gastroenterology.",
    ],
  },
];

const loopedFacts = [...factsData, ...factsData, ...factsData];

type FactType = (typeof factsData)[0];

export default function HomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<FactType>>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarIndex, setAvatarIndex] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");
  const [selectedFact, setSelectedFact] = useState<FactType | null>(null);

  const coffee = useThemeColor({}, "coffee");
  const text = useThemeColor({}, "text");

  const fallbackDefaultAvatar = useMemo(() => DEFAULT_AVATARS[0], []);

  useEffect(() => {
    const fetchUserAndAvatar = async () => {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) {
        console.log("getUser error:", userErr.message);
        return;
      }
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || "User");

      const googleAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      if (typeof googleAvatar === "string" && googleAvatar.length > 0) {
        setAvatarUrl(googleAvatar);
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("avatar_index")
        .eq("id", user.id)
        .single();

      if (profileErr) {
        console.log("profile fetch error:", profileErr.message);
        setAvatarIndex(0);
        return;
      }

      const existingIndex = profile?.avatar_index;

      if (existingIndex === null || existingIndex === undefined) {
        const newIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);

        const { error: updateErr } = await supabase
          .from("profiles")
          .update({ avatar_index: newIndex })
          .eq("id", user.id);

        if (updateErr) {
          console.log("avatar_index update error:", updateErr.message);
          setAvatarIndex(0);
          return;
        }

        setAvatarIndex(newIndex);
      } else {
        const safeIndex = Math.max(
          0,
          Math.min(DEFAULT_AVATARS.length - 1, Number(existingIndex))
        );
        setAvatarIndex(safeIndex);
      }
    };

    fetchUserAndAvatar();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: factsData.length,
        animated: false,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "good morning";
    if (hour < 18) return "good afternoon";
    return "good evening";
  };

  const handleInfiniteScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const singleSetWidth = contentWidth / 3;

    if (offsetX < singleSetWidth * 0.2) {
      flatListRef.current?.scrollToOffset({
        offset: offsetX + singleSetWidth,
        animated: false,
      });
    } else if (offsetX > singleSetWidth * 1.8) {
      flatListRef.current?.scrollToOffset({
        offset: offsetX - singleSetWidth,
        animated: false,
      });
    }
  };

  const defaultAvatarSource =
    avatarIndex !== null ? DEFAULT_AVATARS[avatarIndex] : fallbackDefaultAvatar;

  const FactCard = ({ fact }: { fact: FactType }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setSelectedFact(fact)}
      style={styles.cardWrapper}
    >
      <ThemedView style={styles.smallCard}>
        <Image
          source={fact.image}
          style={styles.coffeeImage}
          contentFit="contain"
        />
        <ThemedText style={[styles.smallCardText, { color: text }]}>
          {fact.shortFact}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView
        style={[
          styles.customHeader,
          { backgroundColor: Colors.light.background },
        ]}
      >
        <Image
          source={require("../../assets/images/streak.svg")}
          style={styles.headerIcon}
          contentFit="contain"
        />

        <View style={styles.headerMiddle}>
          <ThemedText style={[styles.acidexText, { color: coffee }]}>
            acidex.
          </ThemedText>
          <ThemedText style={[styles.analyzerText, { color: coffee }]}>
            your coffee analyzer
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/profile")}
          activeOpacity={0.7}
        >
          <Image
            source={avatarUrl ? { uri: avatarUrl } : defaultAvatarSource}
            style={styles.avatarImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedView style={styles.container}>
          <ThemedView
            style={[
              styles.darkCard,
              { backgroundColor: Colors.light.surface },
            ]}
          >
            <Image
              source={require("../../assets/images/home-illustration.png")}
              style={styles.illustration}
              contentFit="contain"
            />
            <ThemedText style={styles.greetingText}>
              {getGreeting()}, {userName.split(" ")[0]}.
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.analyzeButton,
                { backgroundColor: Colors.light.background },
              ]}
              onPress={() => console.log("Analyze coffee pressed")}
            >
              <ThemedText style={[styles.analyzeButtonText, { color: coffee }]}>
                analyze your coffee
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedText style={[styles.didYouKnowText, { color: text }]}>
            did you know?
          </ThemedText>

          <FlatList
            ref={flatListRef}
            data={loopedFacts}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            renderItem={({ item }) => <FactCard fact={item} />}
            onScroll={handleInfiniteScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={ITEM_SIZE}
            snapToAlignment="start"
            bounces={false}
            disableIntervalMomentum={false}
            getItemLayout={(_, index) => ({
              length: ITEM_SIZE,
              offset: ITEM_SIZE * index,
              index,
            })}
          />
        </ThemedView>
      </ScrollView>

      <Modal
        visible={!!selectedFact}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedFact(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedFact && (
              <>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Image
                    source={selectedFact.image}
                    style={styles.modalImage}
                    contentFit="contain"
                  />

                  <ThemedText style={[styles.modalTitle, { color: coffee }]}>
                    {selectedFact.title}
                  </ThemedText>

                  <ThemedText style={[styles.modalText, { color: text }]}>
                    {selectedFact.fullText}
                  </ThemedText>

                  <ThemedText
                    style={[styles.modalSuggestion, { color: coffee }]}
                  >
                    suggestion: {selectedFact.suggestion}
                  </ThemedText>

                  <ThemedText
                    style={[styles.modalReferencesTitle, { color: coffee }]}
                  >
                    references
                  </ThemedText>

                  {selectedFact.references.map((ref, index) => (
                    <ThemedText
                      key={index}
                      style={[styles.modalReference, { color: text }]}
                    >
                      • {ref}
                    </ThemedText>
                  ))}
                </ScrollView>

                <Pressable
                  style={[styles.closeButton, { backgroundColor: coffee }]}
                  onPress={() => setSelectedFact(null)}
                >
                  <ThemedText style={styles.closeButtonText}>close</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },

  scrollContent: {
    paddingBottom: 24,
  },

  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
  },

  headerIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
  },

  headerMiddle: {
    flex: 1,
    alignItems: "center",
  },

  acidexText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },

  analyzerText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },

  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  darkCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 16,
  },

  illustration: {
    width: 300,
    height: 170,
    alignSelf: "center",
    marginBottom: 1,
    marginTop: 20,
  },

  greetingText: {
    color: Colors.light.background,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 45,
    textAlign: "center",
  },

  analyzeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
  },

  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "lowercase",
  },

  didYouKnowText: {
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "600",
    marginBottom: 30,
    textAlign: "center",
  },

  horizontalScrollContent: {
    paddingLeft: SIDE_SPACING,
    paddingRight: SIDE_SPACING - CARD_GAP,
    paddingTop: 6,
    paddingBottom: 20,
  },

  cardWrapper: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
  },

  smallCard: {
    width: "100%",
    height: CARD_WIDTH * 1.18,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 7,
  },

  coffeeImage: {
    width: "90%",
    height: "65%",
    marginBottom: 8,
  },

  smallCardText: {
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 18,
    paddingHorizontal: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
  },

  modalImage: {
    width: "100%",
    height: 180,
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },

  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
    textAlign: "justify",
  },

  modalSuggestion: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 16,
  },

  modalReferencesTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "lowercase",
  },

  modalReference: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },

  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },

  closeButtonText: {
    color: "#F5F5F5",
    fontSize: 15,
    fontWeight: "600",
    textTransform: "lowercase",
  },
});