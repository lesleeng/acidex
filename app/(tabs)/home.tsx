import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import Colors from "@/constants/colors";
import StreakIcon from "../../assets/images/streak.svg";

const { width } = Dimensions.get("window");

// carousel sizing
const CARD_WIDTH    = width * 0.55;
const CARD_GAP      = 16;
const ITEM_SIZE     = CARD_WIDTH + CARD_GAP;
const SIDE_SPACING  = (width - CARD_WIDTH) / 2;
const FACT_CARD_HEIGHT = CARD_WIDTH * 0.98;

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
    shortFact: "Coffee naturally contains acids that affect both flavor and digestion.",
    title: "Coffee naturally contains acids",
    fullText:
      "Coffee contains natural compounds such as chlorogenic acids, quinic acid, and citric acid. These acids contribute to coffee's bright, tangy, or fruity taste depending on the roast and brewing method. Light roasts usually retain more of these acids, while darker roasts often taste less acidic. Some of these compounds, especially chlorogenic acids, are also known for their antioxidant properties.",
    suggestion: "Acidity is not always bad—it also helps create coffee's flavor profile.",
    references: [
      "Farah, A. (2012). Coffee Constituents. Royal Society of Chemistry.",
      "NIH – National Library of Medicine: Chlorogenic acid studies.",
      "Specialty Coffee Association (SCA).",
    ],
  },
  {
    id: 2,
    image: require("../../assets/images/fact-2.png"),
    shortFact: "Highly acidic coffee may trigger heartburn or stomach discomfort in sensitive people.",
    title: "Acidic coffee can cause discomfort",
    fullText:
      "Coffee can stimulate stomach acid production. In some individuals, especially those with sensitive digestion, this may lead to symptoms such as heartburn, acid reflux, or mild stomach discomfort. Caffeine may also relax the lower esophageal sphincter, making it easier for stomach acid to rise into the esophagus.",
    suggestion: "If coffee upsets your stomach, try drinking it after meals or choosing low-acid options.",
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
    suggestion: "Cold brew may be a better choice if you want a smoother, lower-acid coffee experience.",
    references: [
      "Rao, N. Z., & Fuller, M. (2018). Acidity and antioxidant activity of cold brew coffee.",
      "Scientific Reports.",
      "Coffee chemistry studies on brew temperature and acid extraction.",
    ],
  },
  {
    id: 4,
    image: require("../../assets/images/fact-4.png"),
    shortFact: "Acidic coffee may irritate the stomach lining in some people.",
    title: "Coffee may irritate the stomach lining",
    fullText:
      "For some people, coffee can worsen stomach irritation, especially if they already have gastritis, reflux, or a sensitive stomach. This is not caused by acidity alone—caffeine and other compounds in coffee may also contribute. Tolerance varies from person to person, so one person may feel fine while another experiences discomfort after a single cup.",
    suggestion: "Pay attention to your own body's response—personal tolerance matters most.",
    references: [
      "National Institutes of Health (NIH).",
      "Mayo Clinic – Gastritis and diet guidance.",
      "World Journal of Gastroenterology.",
    ],
  },
];

const loopedFacts = [...factsData, ...factsData, ...factsData];

type FactType = (typeof factsData)[0];
type AnalyzeStatus = "idle" | "no-device" | "analyzing" | "done";
type StomachState  = "empty stomach" | "after meal" | null;

const STREAK_COUNT_KEY      = "acidex_streak_count";
const LAST_ANALYSIS_DATE_KEY = "acidex_last_analysis_date";

export default function HomeScreen() {
  const router       = useRouter();
  const flatListRef  = useRef<FlatList<FactType>>(null);

  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null);
  const [avatarIndex,  setAvatarIndex]  = useState<number | null>(null);
  const [userName,     setUserName]     = useState("User");
  const [selectedFact, setSelectedFact] = useState<FactType | null>(null);

  const [streakCount,          setStreakCount]          = useState(0);
  const [streakPopupVisible,   setStreakPopupVisible]   = useState(false);
  const [isOtgConnected,       setIsOtgConnected]       = useState(false);
  const [analyzeModalVisible,  setAnalyzeModalVisible]  = useState(false);
  const [analyzeStatus,        setAnalyzeStatus]        = useState<AnalyzeStatus>("idle");
  const [stomachState,         setStomachState]         = useState<StomachState>(null);
  const [probeReady,           setProbeReady]           = useState(false);

  const coffee = useThemeColor({}, "coffee");
  const text   = useThemeColor({}, "text");

  const fallbackDefaultAvatar = useMemo(() => DEFAULT_AVATARS[0], []);

  // ── data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserAndAvatar = async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) { console.log("getUser error:", userErr.message); return; }
      if (!user) return;

      setUserName(user.user_metadata?.full_name || user.email || "User");

      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      if (typeof googleAvatar === "string" && googleAvatar.length > 0) {
        setAvatarUrl(googleAvatar); return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles").select("avatar_index").eq("id", user.id).single();

      if (profileErr) { console.log("profile fetch error:", profileErr.message); setAvatarIndex(0); return; }

      const existingIndex = profile?.avatar_index;
      if (existingIndex === null || existingIndex === undefined) {
        const newIndex = Math.floor(Math.random() * DEFAULT_AVATARS.length);
        const { error: updateErr } = await supabase
          .from("profiles").update({ avatar_index: newIndex }).eq("id", user.id);
        if (updateErr) { console.log("avatar_index update error:", updateErr.message); setAvatarIndex(0); return; }
        setAvatarIndex(newIndex);
      } else {
        setAvatarIndex(Math.max(0, Math.min(DEFAULT_AVATARS.length - 1, Number(existingIndex))));
      }
    };

    fetchUserAndAvatar();
    loadStreak();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: factsData.length, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadStreak = async () => {
    try {
      const stored = await AsyncStorage.getItem(STREAK_COUNT_KEY);
      setStreakCount(stored ? Number(stored) : 0);
    } catch (error) { console.log("load streak error:", error); }
  };

  const getTodayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
  };

  const incrementStreakIfNeeded = async () => {
    try {
      const today           = getTodayString();
      const lastAnalysisDate = await AsyncStorage.getItem(LAST_ANALYSIS_DATE_KEY);
      const storedCount      = await AsyncStorage.getItem(STREAK_COUNT_KEY);
      const currentCount     = storedCount ? Number(storedCount) : 0;
      if (lastAnalysisDate === today) { setStreakCount(currentCount); return; }
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(STREAK_COUNT_KEY, String(newCount));
      await AsyncStorage.setItem(LAST_ANALYSIS_DATE_KEY, today);
      setStreakCount(newCount);
    } catch (error) { console.log("increment streak error:", error); }
  };

  const detectOtgDevice = async () => isOtgConnected;
  const runAnalysisModule = async () =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), 2200));

  const handleAnalyzePress = async () => {
    const hasOtg = await detectOtgDevice();
    setAnalyzeModalVisible(true);
    if (!hasOtg) { setAnalyzeStatus("no-device"); return; }
    setProbeReady(false);
    setAnalyzeStatus("analyzing");
    try {
      await runAnalysisModule();
      await incrementStreakIfNeeded();
      setProbeReady(true);
      // only advance to done if user has already logged stomach state
      // otherwise the useEffect below will catch it when they tap
    } catch (error) {
      console.log("analysis error:", error);
      setAnalyzeStatus("idle");
      setAnalyzeModalVisible(false);
    }
  };

  // advance to "done" only when BOTH probe finished AND stomach state is selected
  useEffect(() => {
    if (probeReady && stomachState !== null && analyzeStatus === "analyzing") {
      setAnalyzeStatus("done");
    }
  }, [probeReady, stomachState, analyzeStatus]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "good morning";
    if (hour < 18) return "good afternoon";
    return "good evening";
  };

  const handleInfiniteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX      = event.nativeEvent.contentOffset.x;
    const contentWidth = event.nativeEvent.contentSize.width;
    const singleSetWidth = contentWidth / 3;
    if (offsetX < singleSetWidth * 0.2) {
      flatListRef.current?.scrollToOffset({ offset: offsetX + singleSetWidth, animated: false });
    } else if (offsetX > singleSetWidth * 1.8) {
      flatListRef.current?.scrollToOffset({ offset: offsetX - singleSetWidth, animated: false });
    }
  };

  const closeAnalyzeModal = () => {
    if (analyzeStatus !== "analyzing") {
      setAnalyzeModalVisible(false);
      setAnalyzeStatus("idle");
      setStomachState(null);
      setProbeReady(false);
    }
  };

  const defaultAvatarSource = avatarIndex !== null ? DEFAULT_AVATARS[avatarIndex] : fallbackDefaultAvatar;

  // ── Fact card ─────────────────────────────────────────────────────────────
  const FactCard = ({ fact }: { fact: FactType }) => (
    <TouchableOpacity activeOpacity={0.88} onPress={() => setSelectedFact(fact)} style={styles.cardWrapper}>
      <View style={styles.smallCard}>
        <Image source={fact.image} style={styles.coffeeImage} contentFit="contain" />
        <ThemedText style={styles.smallCardText}>{fact.shortFact}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  // ── Streak label ──────────────────────────────────────────────────────────
  const streakLabel = streakCount === 0
    ? "no streak yet"
    : streakCount === 1
    ? "you're on your 1st day!"
    : `you're on a ${streakCount}-day streak!`;

  return (
    <ThemedView style={styles.root}>

      {/* ── Header ── */}
      <ThemedView style={[styles.customHeader, { backgroundColor: Colors.light.background }]}>
        {/* streak pill */}
        <View style={[styles.headerSide, styles.headerSideLeft]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.streakPill}
            onPress={() => setStreakPopupVisible(true)}
          >
            <StreakIcon width={15} height={15} style={styles.streakPillIcon} />
            <ThemedText style={[styles.streakNumber, { color: coffee }]}>{streakCount}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* brand */}
        <View style={styles.headerMiddle}>
          <ThemedText style={[styles.acidexText, { color: coffee }]}>acidex.</ThemedText>
          <ThemedText style={[styles.analyzerText, { color: coffee }]}>your coffee analyzer</ThemedText>
        </View>

        {/* avatar */}
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity onPress={() => router.push("/(auth)/profile")} activeOpacity={0.7}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : defaultAvatarSource}
              style={styles.avatarImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* ── Body ── */}
      <ThemedView style={styles.body}>

        {/* hero card */}
        <ThemedView style={[styles.darkCard, { backgroundColor: Colors.light.surface }]}>
          <Image
            source={require("../../assets/images/home-illustration.png")}
            style={styles.illustration}
            contentFit="contain"
          />
          <ThemedText style={styles.greetingText}>
            {getGreeting()}, {userName.split(" ")[0]}.
          </ThemedText>
          <TouchableOpacity
            style={[styles.analyzeButton, { backgroundColor: Colors.light.background }]}
            onPress={handleAnalyzePress}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.analyzeButtonText, { color: coffee }]}>
              analyze your coffee
            </ThemedText>
          </TouchableOpacity>

          {/* dev toggle */}
          <TouchableOpacity style={styles.devOtgToggle} onPress={() => setIsOtgConnected((p) => !p)}>
            <ThemedText style={[styles.devOtgToggleText, { color: "rgba(255,255,255,0.45)" }]}>
              dev · otg {isOtgConnected ? "connected" : "off"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* did you know */}
        <ThemedText style={[styles.didYouKnowText, { color: text }]}>did you know?</ThemedText>

        {/* carousel */}
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
          getItemLayout={(_, index) => ({ length: ITEM_SIZE, offset: ITEM_SIZE * index, index })}
        />
      </ThemedView>

      {/* ── Streak popup ── */}
      <Modal
        visible={streakPopupVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setStreakPopupVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setStreakPopupVisible(false)}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.streakModal}>
              {/* flame icon area */}
              <View style={[styles.streakModalIconWrap, { backgroundColor: coffee + "18" }]}>
                <StreakIcon width={36} height={36} />
              </View>

              <ThemedText style={[styles.streakModalCount, { color: coffee }]}>
                {streakCount}
              </ThemedText>
              <ThemedText style={styles.streakModalDayLabel}>
                day{streakCount !== 1 ? "s" : ""} in a row
              </ThemedText>
              <ThemedText style={styles.streakModalMessage}>
                {streakLabel}
              </ThemedText>

              {/* progress dots */}
              {streakCount > 0 && (
                <View style={styles.streakDots}>
                  {Array.from({ length: Math.min(streakCount, 7) }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.streakDot,
                        { backgroundColor: i < streakCount ? coffee : "#EDE3DC" },
                      ]}
                    />
                  ))}
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.streakModalClose, { backgroundColor: coffee }]}
                onPress={() => setStreakPopupVisible(false)}
              >
                <ThemedText style={styles.streakModalCloseText}>okay</ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fact detail modal ── */}
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
                <FlatList
                  data={[selectedFact]}
                  keyExtractor={(item) => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <View>
                      <Image source={item.image} style={styles.modalImage} contentFit="contain" />
                      <ThemedText style={[styles.modalTitle, { color: coffee }]}>{item.title}</ThemedText>
                      <ThemedText style={[styles.modalText, { color: text }]}>{item.fullText}</ThemedText>
                      <View style={styles.modalSuggestionBlock}>
                        <Ionicons name="bulb-outline" size={14} color={coffee} />
                        <ThemedText style={[styles.modalSuggestion, { color: coffee }]}>
                          {item.suggestion}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.modalReferencesTitle, { color: coffee }]}>references</ThemedText>
                      {item.references.map((ref, index) => (
                        <View key={index} style={styles.modalRefRow}>
                          <View style={styles.modalRefDot} />
                          <ThemedText style={[styles.modalReference, { color: text }]}>{ref}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                />
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

      {/* ── Analyze modal ── */}
      <Modal
        visible={analyzeModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeAnalyzeModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAnalyzeModal}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.analyzeModalContent}>

              {/* no device */}
              {analyzeStatus === "no-device" && (
                <>
                  <View style={[styles.analyzeIconCircle, { backgroundColor: "#FEF0D6" }]}>
                    <Ionicons name="hardware-chip-outline" size={28} color="#C38C49" />
                  </View>
                  <ThemedText style={[styles.analyzeModalTitle, { color: coffee }]}>
                    insert device
                  </ThemedText>
                  <ThemedText style={styles.analyzeModalText}>
                    No OTG-connected device was detected. Please insert the probe before analyzing.
                  </ThemedText>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.actionButton, { backgroundColor: coffee }]}
                    onPress={closeAnalyzeModal}
                  >
                    <ThemedText style={styles.actionButtonText}>okay</ThemedText>
                  </TouchableOpacity>
                </>
              )}

              {/* analyzing — parallel stomach log */}
              {analyzeStatus === "analyzing" && (
                <>
                  {/* spinner header */}
                  <View style={[styles.analyzeIconCircle, { backgroundColor: coffee + "18" }]}>
                    <ActivityIndicator size="small" color={coffee} />
                  </View>
                  <ThemedText style={[styles.analyzeModalTitle, { color: coffee }]}>
                    reading pH...
                  </ThemedText>
                  <ThemedText style={styles.analyzeModalText}>
                    While the probe reads, tell us your stomach state.
                  </ThemedText>

                  {/* stomach log card */}
                  <View style={styles.stomachCard}>
                    <View style={styles.stomachCardHeader}>
                      <Ionicons name="body-outline" size={14} color="#8B5E3C" />
                      <ThemedText style={styles.stomachCardTitle}>stomach state</ThemedText>
                    </View>

                    <View style={styles.stomachOptions}>
                      {(["empty stomach", "after meal"] as StomachState[]).map((opt) => {
                        const active = stomachState === opt;
                        const icon   = opt === "empty stomach" ? "time-outline" : "restaurant-outline";
                        return (
                          <TouchableOpacity
                            key={opt}
                            activeOpacity={0.8}
                            style={[styles.stomachOption, active && { backgroundColor: coffee, borderColor: coffee }]}
                            onPress={() => setStomachState(opt)}
                          >
                            <Ionicons
                              name={icon}
                              size={18}
                              color={active ? "#FFF" : "#8B5E3C"}
                            />
                            <ThemedText style={[styles.stomachOptionText, active && { color: "#FFF" }]}>
                              {opt}
                            </ThemedText>
                            {active && (
                              <Ionicons name="checkmark-circle" size={15} color="rgba(255,255,255,0.75)" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {stomachState ? (
                      <View style={styles.stomachConfirmed}>
                        <Ionicons name="checkmark-circle-outline" size={13} color="#27AE60" />
                        <ThemedText style={styles.stomachConfirmedText}>logged — you can still change it</ThemedText>
                      </View>
                    ) : probeReady ? (
                      <View style={styles.stomachConfirmed}>
                        <Ionicons name="alert-circle-outline" size={13} color="#C38C49" />
                        <ThemedText style={[styles.stomachConfirmedText, { color: "#C38C49" }]}>
                          probe done — please log your stomach state to continue
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText style={styles.stomachHint}>optional, but helps with health advice</ThemedText>
                    )}
                  </View>

                  {/* pulse dots */}
                  <View style={styles.analyzingDots}>
                    {[0, 1, 2].map((i) => (
                      <View key={i} style={[styles.analyzingDot, { backgroundColor: coffee, opacity: 0.3 + i * 0.3 }]} />
                    ))}
                  </View>
                </>
              )}

              {/* done */}
              {analyzeStatus === "done" && (
                <>
                  <View style={[styles.analyzeIconCircle, { backgroundColor: "#DCF0E4" }]}>
                    <Ionicons name="checkmark-circle-outline" size={28} color="#27AE60" />
                  </View>
                  <ThemedText style={[styles.analyzeModalTitle, { color: coffee }]}>
                    analysis complete
                  </ThemedText>
                  <ThemedText style={styles.analyzeModalText}>
                    Your result is ready. Tap below to view your latest coffee analysis.
                  </ThemedText>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.actionButton, { backgroundColor: coffee }]}
                    onPress={() => {
                      closeAnalyzeModal();
                      router.push("/(tabs)/results");
                    }}
                  >
                    <ThemedText style={styles.actionButtonText}>view results</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.dismissLink}
                    onPress={closeAnalyzeModal}
                  >
                    <ThemedText style={[styles.dismissLinkText, { color: coffee }]}>dismiss</ThemedText>
                  </TouchableOpacity>
                </>
              )}

            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // header
  customHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 15,
  },
  headerSide:      { flex: 1, justifyContent: "center" },
  headerSideLeft:  { alignItems: "flex-start" },
  headerSideRight: { alignItems: "flex-end" },
  headerMiddle:    { flex: 1, alignItems: "center", justifyContent: "center" },

  streakPill: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(60,44,36,0.22)",
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  streakPillIcon: { marginRight: 5 },
  streakNumber:   { fontSize: 13, fontWeight: "600" },
  acidexText:     { fontSize: 18, fontWeight: "700", lineHeight: 20, textAlign: "center" },
  analyzerText:   { fontSize: 12, opacity: 0.6, textAlign: "center" },
  avatarImage:    { width: 35, height: 35, borderRadius: 16 },

  // body
  body: { flex: 1, paddingTop: 5, paddingBottom: 12 },

  // hero card
  darkCard: {
    borderRadius: 20, paddingHorizontal: 20,
    marginTop: 12, marginBottom: 40, marginHorizontal: 16,
    alignItems: "center",
  },
  illustration: {
    width: 240, height: 135, alignSelf: "center", marginTop: 40, marginBottom: 4,
  },
  greetingText: {
    color: Colors.light.background, fontSize: 19, fontWeight: "600",
    marginTop: 6, marginBottom: 45, textAlign: "center",
  },
  analyzeButton: {
    paddingVertical: 11, paddingHorizontal: 30, borderRadius: 30,
  },
  analyzeButtonText: { fontSize: 15, fontWeight: "700", textTransform: "lowercase" },

  devOtgToggle:     { marginTop: 8, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  devOtgToggleText: { fontSize: 10, textTransform: "lowercase" },

  // carousel
  didYouKnowText: {
    fontSize: 17, fontStyle: "italic", fontWeight: "600",
    marginBottom: 10, textAlign: "center",
  },
  horizontalScrollContent: {
    paddingLeft: SIDE_SPACING, paddingRight: SIDE_SPACING - CARD_GAP,
    paddingTop: 4, paddingBottom: 10,
  },
  cardWrapper: { width: CARD_WIDTH, marginRight: CARD_GAP },
  smallCard: {
    width: "100%", height: FACT_CARD_HEIGHT,
    borderRadius: 18, padding: 10,
    alignItems: "center", justifyContent: "flex-start",
    backgroundColor: "#FFFAF7",
    borderWidth: 1, borderColor: "#EDE3DC",
    shadowColor: "#6B4E3D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coffeeImage:   { width: "85%", height: 120, marginBottom: 6 },
  smallCardText: { fontSize: 12, textAlign: "center", fontWeight: "500", lineHeight: 17, paddingHorizontal: 4, color: "#4B3A33" },

  // modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },

  // streak popup
  streakModal: {
    width: width * 0.78, backgroundColor: "#FFFAF7",
    borderRadius: 24, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "#EDE3DC",
  },
  streakModalIconWrap: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  streakModalCount: {
    fontSize: 48, fontWeight: "700", lineHeight: 52, letterSpacing: -1,
  },
  streakModalDayLabel: {
    fontSize: 13, color: "#A08880", marginTop: 2, marginBottom: 8,
  },
  streakModalMessage: {
    fontSize: 14, fontWeight: "600", color: "#3C2C24",
    textAlign: "center", marginBottom: 16,
  },
  streakDots:  { flexDirection: "row", gap: 6, marginBottom: 20 },
  streakDot:   { width: 8, height: 8, borderRadius: 4 },
  streakModalClose: {
    width: "100%", paddingVertical: 12, borderRadius: 999, alignItems: "center",
  },
  streakModalCloseText: { color: "#FFF", fontSize: 14, fontWeight: "600", textTransform: "lowercase" },

  // fact modal
  modalContent: {
    width: "100%", maxHeight: "85%",
    backgroundColor: "#FFFAF7", borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: "#EDE3DC",
  },
  modalImage:  { width: "100%", height: 180, marginBottom: 15 },
  modalTitle:  { fontSize: 17, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  modalText:   { fontSize: 13, lineHeight: 21, marginBottom: 14, color: "#4B3A33", textAlign: "justify" },
  modalSuggestionBlock: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "rgba(139,94,60,0.07)", borderRadius: 12,
    padding: 10, marginBottom: 16,
  },
  modalSuggestion:      { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  modalReferencesTitle: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "lowercase", opacity: 0.7 },
  modalRefRow:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  modalRefDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: "#C4A882", marginTop: 8, marginRight: 8, flexShrink: 0 },
  modalReference: { flex: 1, fontSize: 12, lineHeight: 18, color: "#7A675C", textAlign: "justify" },
  closeButton:     { marginTop: 16, paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  closeButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600", textTransform: "lowercase" },

  // analyze modal
  analyzeModalContent: {
    width: width * 0.82, backgroundColor: "#FFFAF7",
    borderRadius: 24, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: "#EDE3DC",
  },
  analyzeIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  analyzeModalTitle: {
    fontSize: 17, fontWeight: "700", textAlign: "center",
    textTransform: "lowercase", marginBottom: 8,
  },
  analyzeModalText: {
    fontSize: 13, lineHeight: 20, textAlign: "center",
    color: "#7A675C", marginBottom: 20,
  },
  analyzingDots: { flexDirection: "row", gap: 8, marginTop: 4 },
  analyzingDot:  { width: 8, height: 8, borderRadius: 4 },

  actionButton: {
    width: "100%", paddingVertical: 12, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
  },
  actionButtonText: { color: "#FFF", fontSize: 14, fontWeight: "600", textTransform: "lowercase", textAlign: "center" },
  dismissLink:      { marginTop: 12, paddingVertical: 4 },
  dismissLinkText:  { fontSize: 13, fontWeight: "500", opacity: 0.7, textTransform: "lowercase" },

  // stomach log (shown during analysis)
  stomachCard: {
    width: "100%",
    backgroundColor: "#F4EEEA",
    borderRadius: 16, padding: 14,
    marginBottom: 16,
  },
  stomachCardHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12,
  },
  stomachCardTitle: {
    fontSize: 12, fontWeight: "700", color: "#3C2C24", textTransform: "lowercase",
  },
  stomachOptions: { gap: 8 },
  stomachOption: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFFAF7",
    borderWidth: 1, borderColor: "#EDE3DC",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  stomachOptionText: {
    flex: 1, fontSize: 13, fontWeight: "600", color: "#3C2C24",
  },
  stomachConfirmed: {
    flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10,
  },
  stomachConfirmedText: {
    fontSize: 11, color: "#27AE60", fontWeight: "500",
  },
  stomachHint: {
    fontSize: 11, color: "#A08880", marginTop: 10, textAlign: "center",
  },
});