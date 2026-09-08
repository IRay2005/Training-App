import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../auth/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import AthleteHomeScreen from "../screens/AthleteHomeScreen";
import CoachDashboardScreen from "../screens/CoachDashboardScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user.role === "COACH" ? (
          <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
        ) : (
          <Stack.Screen name="AthleteHome" component={AthleteHomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
