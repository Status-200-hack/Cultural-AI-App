import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import * as Location from 'expo-location';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Search as SearchIcon, MapPin, Clock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import haversine from 'haversine-distance';
import { GEMINI_API_KEY_EXPLORE, UNSPLASH_ACCESS_KEY } from '@env';

// Replace direct API usage with:
const GEMINI_API_KEY = GEMINI_API_KEY_EXPLORE;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface Place {
  name: string;
  location: string;
  description: string;
  type: string;
  year?: number;
  visitingHours?: string;
  rating?: number;
  image?: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function TabTwoScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    "Inter-Regular": Inter_400Regular,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    })();
  }, []);

  const fetchImageFromUnsplash = async (query: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      return data.results[0]?.urls.regular || 'https://via.placeholder.com/150';
    } catch (error) {
      return 'https://via.placeholder.com/150';
    }
  };

  const cleanGeminiResponse = (text: string): string => {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .replace(/\\+/g, '')
      .replace(/\n/g, '')
      .trim();
  };

  const validatePlaceStructure = (place: any): boolean => {
    return (
      typeof place.name === 'string' &&
      typeof place.location === 'string' &&
      typeof place.description === 'string' &&
      typeof place.type === 'string' &&
      typeof place.latitude === 'number' &&
      typeof place.longitude === 'number'
    );
  };

  const fetchPlacesFromGemini = async (query: string) => {
    if (!query || !userLocation) return;
    
    setIsSearching(true);
    setErrorMsg(null);
    setPlaces([]);
    setAvailableTypes([]);
    setSelectedType(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
      const prompt = `Provide valid JSON array of historical places only related to "${query}". Include:
      - Real coordinates
      - Name, location, description, type (e.g. temple, palace, garden, fort, museum, park, heritage sites, monuments, and any other important historic places)
      - Year established (optional)
      - Visiting hours (optional)
      - Rating (1-5 optional)
      Format STRICT JSON without markdown:
      [{
        "name": "Place name",
        "location": "City, Country",
        "description": "Brief history",
        "type": "fort",
        "year": 1900,
        "visitingHours": "9 AM - 5 PM",
        "rating": 4.5,
        "latitude": 12.3456,
        "longitude": -78.9012
      }]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanedText = cleanGeminiResponse(text);
      
      let parsedResults: Place[] = [];
      try {
        parsedResults = JSON.parse(cleanedText);
      } catch (parseError) {
        throw new Error('Failed to parse response from AI');
      }

      const validResults = parsedResults.filter(validatePlaceStructure);
      if (validResults.length === 0) {
        throw new Error('No valid historical places found');
      }

      const withDistances = validResults.map(place => ({
        ...place,
        distance: Number(
          (haversine(
            userLocation,
            { latitude: place.latitude, longitude: place.longitude }
          ) / 1000).toFixed(2)
        )
      }));

      const updatedResults = await Promise.all(
        withDistances.map(async (place) => ({
          ...place,
          image: await fetchImageFromUnsplash(place.name)
        }))
      );

      setPlaces(updatedResults);
      const types = Array.from(new Set(updatedResults.map(p => p.type)));
      setAvailableTypes(types);
    } catch (error) {
      console.error("Search error:", error);
      setErrorMsg("Failed to search places. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 2) {
      fetchPlacesFromGemini(searchQuery.trim());
    }
  };

  const openGoogleMaps = (placeName: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`;
    Linking.openURL(url).catch(err => console.error('Failed to open maps:', err));
  };

  const filteredPlaces = selectedType 
    ? places.filter(place => place.type === selectedType)
    : places;

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Text style={styles.title}>Historical Explorer</Text>
          <Text style={styles.subtitle}>Discover cultural heritage sites</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search historical places..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {isSearching && <ActivityIndicator size="small" color="#4F46E5" />}
        </View>

        {availableTypes.length > 0 && (
          <View style={styles.filterContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <Pressable
                style={[styles.filterButton, !selectedType && styles.activeFilter]}
                onPress={() => setSelectedType(null)}
              >
                <Text style={[styles.filterText, !selectedType && styles.activeFilterText]}>All</Text>
              </Pressable>
              {availableTypes.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.filterButton, selectedType === type && styles.activeFilter]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.filterText, selectedType === type && styles.activeFilterText]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {userLocation && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
            <Marker
              coordinate={userLocation}
              title="Your Location"
              pinColor="#4F46E5"
            />
            {filteredPlaces.map((place, index) => (
              <Marker
                key={`place-${index}`}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.name}
                description={place.location}
                pinColor="#FF0000"
                onPress={() => openGoogleMaps(place.name)}
              />
            ))}
          </MapView>
        )}

        <View style={styles.placesContainer}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No places found matching the current filters</Text>
            </View>
          ) : (
            filteredPlaces.map((place, index) => (
              <Pressable 
                key={index} 
                style={styles.placeCard}
                onPress={() => openGoogleMaps(place.name)}
              >
                <View style={styles.placeHeader}>
                  <Image
                    source={{ uri: place.image }}
                    style={styles.placeImage}
                  />
                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>
                      {place.distance ? `${place.distance} km` : 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <View style={styles.locationContainer}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.locationText}>{place.location}</Text>
                  </View>
                  <Text style={styles.descriptionText}>{place.description}</Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.timeContainer}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.timeText}>{place.visitingHours || "N/A"}</Text>
                    </View>
                    <View style={styles.typeContainer}>
                      <Text style={styles.typeText}>{place.type}</Text>
                    </View>
                    <Text style={styles.ratingText}>★ {place.rating?.toFixed(1) || "N/A"}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    zIndex: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#000000',
    textAlign: "center",
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 4,
    textAlign: "center",
    fontFamily: 'Inter-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilter: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    margin: 12,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  map: {
    height: 280,
    marginHorizontal: 16,
    borderRadius: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  placesContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  placeHeader: {
    position: 'relative',
  },
  placeImage: {
    width: '100%',
    height: 180,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 18,
    color: '#111827',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  ratingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontFamily: 'Inter-SemiBold',
  },
  noResults: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  typeContainer: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  typeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});
