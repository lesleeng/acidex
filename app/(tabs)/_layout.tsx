import { Tabs } from 'expo-router';
import React from 'react';
import 'expo-crypto';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function AnimatedTabIcon({
  focused,
  color,
  name,
}: {
  focused: boolean;
  color: string;
  name: Parameters<typeof IconSymbol>[0]['name'];
}) {
  const scale = React.useRef(new Animated.Value(focused ? 1 : 0.92)).current;
  const opacity = React.useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1 : 0.92,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.7,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacity, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <IconSymbol size={28} name={name} color={color} />
    </Animated.View>
  );
}

function AnimatedTabLabel({ focused, title }: { focused: boolean; title: string }) {
  const opacity = React.useRef(new Animated.Value(focused ? 1 : 0.75)).current;
  const translateY = React.useRef(new Animated.Value(focused ? 0 : 1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.75,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: focused ? 0 : 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, opacity, translateY]);

  return <Animated.Text style={[styles.label, { opacity, transform: [{ translateY }] }]}>{title}</Animated.Text>;
}

function SlidingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = React.useState(0);
  const translateX = React.useRef(new Animated.Value(0)).current;
  const tabCount = state.routes.length || 1;
  const itemWidth = barWidth > 0 ? barWidth / tabCount : 0;

  React.useEffect(() => {
    if (!itemWidth) return;
    Animated.timing(translateX, {
      toValue: state.index * itemWidth,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [itemWidth, state.index, translateX]);

  return (
    <View
      style={[styles.tabBarWrap, { paddingBottom: Math.max(10, insets.bottom + 6) }]}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
    >
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sliderIndicator,
            {
              width: itemWidth - 16,
              transform: [{ translateX: Animated.add(translateX, new Animated.Value(8)) }],
            },
          ]}
        />
      ) : null}

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const color = focused ? Colors.light.tint : Colors.light.tabIconDefault;
          const title =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const onPress = () => {
            if (process.env.EXPO_OS === 'ios') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              {options.tabBarIcon?.({
                focused,
                color,
                size: 28,
              })}
              <AnimatedTabLabel focused={focused} title={title} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <SlidingTabBar {...props} />}
      detachInactiveScreens={true}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        animation: 'none',
        sceneStyle: styles.scene,
        lazy: true,
        freezeOnBlur: true,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'home',
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon color={color} focused={focused} name="house.fill" />,
          tabBarLabel: ({ focused }) => <AnimatedTabLabel focused={focused} title="home" />,
        }}
      />

      <Tabs.Screen
        name="results"
        options={{
          title: 'results',
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon color={color} focused={focused} name="result.icon" />,
          tabBarLabel: ({ focused }) => <AnimatedTabLabel focused={focused} title="results" />,
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'dashboard',
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon color={color} focused={focused} name="dashboard.icon" />,
          tabBarLabel: ({ focused }) => <AnimatedTabLabel focused={focused} title="dashboard" />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'history',
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon color={color} focused={focused} name="history.icon" />,
          tabBarLabel: ({ focused }) => <AnimatedTabLabel focused={focused} title="history" />,
        }}
      />


    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F5EEEE',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabBarWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  sliderIndicator: {
    position: 'absolute',
    top: 4,
    left: 0,
    height: 3,
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
  },
});
