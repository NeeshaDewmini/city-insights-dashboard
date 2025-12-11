// City Insights Dashboard - Complete Script
// Backend Integration Added

// Set current year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Backend API Configuration
const BACKEND_API_URL = 'http://localhost:5000/api'; // Change for production
const BACKEND_API_KEY = 'city_insight_backend_key_2024'; // From backend .env
let AUTH_TOKEN = localStorage.getItem('cityInsightToken') || null;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const resultsDiv = document.getElementById('results');
const suggestionsDiv = document.getElementById('suggestions');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Load statistics on page load
    if (refreshStatsBtn) {
        loadStatistics();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if we need to get a token
    checkAuthentication();
});

// Setup all event listeners
function setupEventListeners() {
    // Search button
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    // Enter key for search
    if (cityInput) {
        cityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Popular city chips
    document.querySelectorAll('.city-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const city = this.getAttribute('data-city');
            cityInput.value = city;
            handleSearch();
        });
    });
    
    // Refresh statistics button
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', loadStatistics);
    }
    
    // Input suggestions
    if (cityInput) {
        let debounceTimer;
        cityInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = this.value.trim();
            
            if (query.length < 2) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            debounceTimer = setTimeout(() => {
                fetchCitySuggestions(query);
            }, 300);
        });
    }
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (cityInput && !cityInput.contains(e.target) && 
            suggestionsDiv && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
}

// Check authentication and get token if needed
async function checkAuthentication() {
    if (!AUTH_TOKEN) {
        await getAuthToken();
    }
}

// Get authentication token from backend
async function getAuthToken() {
    try {
        const response = await fetch(`${BACKEND_API_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiKey: BACKEND_API_KEY
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            AUTH_TOKEN = data.token;
            localStorage.setItem('cityInsightToken', data.token);
            console.log('Authentication successful');
            return true;
        } else {
            console.warn('Failed to get authentication token:', data.message);
            return false;
        }
        
    } catch (error) {
        console.error('Error getting authentication token:', error);
        return false;
    }
}

// Handle search function
function handleSearch() {
    const city = cityInput.value.trim();

    if (city === "") {
        showError("Please enter a city name");
        return;
    }

    fetchCityData(city);
}

// Show error message
function showError(message) {
    resultsDiv.innerHTML = `
        <div class="error-state card">
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="resetSearch()" class="search-button" style="margin-top: 20px;">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
}

// Reset search
function resetSearch() {
    const defaultState = document.querySelector('.default-state');
    if (defaultState) {
        resultsDiv.innerHTML = defaultState.outerHTML;
    } else {
        resultsDiv.innerHTML = `
            <div class="default-state">
                <div class="placeholder-icon">
                    <i class="fas fa-globe"></i>
                </div>
                <h3>Discover City Insights</h3>
                <p>Enter a city name above to view detailed information about its population, current weather, currency, and more.</p>
            </div>
        `;
    }
    cityInput.value = '';
    cityInput.focus();
}

// Show loading state
function showLoading() {
    resultsDiv.innerHTML = `
        <div class="loading-state card">
            <div class="loading-spinner"></div>
            <h3>Fetching City Data</h3>
            <p>Gathering the latest information for your city...</p>
        </div>
    `;
}

// Fetch city data from APIs
async function fetchCityData(city) {
    showLoading();

    try {
        // STEP 1: Get city details (GeoDB)
        const geoRes = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${city}&limit=5`, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "3a4fe67632msha3786569032db66p138315jsnd853d8b848de",
                "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
            }
        });

        const geoData = await geoRes.json();

        if (!geoData.data || geoData.data.length === 0) {
            showError("City not found. Please try a different city name.");
            return;
        }

        // Use the first result (most relevant)
        const cityInfo = geoData.data[0];

        // STEP 2: Get currency (RestCountries)
        const countryCode = cityInfo.countryCode;
        const countryRes = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const countryData = await countryRes.json();

        const currencyCode = Object.keys(countryData[0].currencies)[0];
        const currencyName = countryData[0].currencies[currencyCode].name;
        const countryName = countryData[0].name.common;

        // STEP 3: Weather (OpenWeather)
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${cityInfo.latitude}&lon=${cityInfo.longitude}&appid=b024175e939ef298e9e72a255bdc4eef&units=metric`
        );
        const weatherData = await weatherRes.json();

        // STEP 4: Exchange Rate API
        let rateToUSD = "Unavailable";
        try {
            const exchangeRes = await fetch(
                `https://api.exchangerate.host/convert?from=${currencyCode}&to=USD&amount=1&access_key=c19936399bc3da42434aed42a48c4fb8`
            );

            const exchangeData = await exchangeRes.json();
            
            if (exchangeData && exchangeData.success) {
                rateToUSD = exchangeData.result.toFixed(4);
            }
        } catch (exchangeError) {
            console.warn("Exchange rate API error:", exchangeError);
        }

        // Format population with commas
        const formattedPopulation = cityInfo.population.toLocaleString();

        // Determine weather icon
        const weatherIcon = getWeatherIcon(weatherData.weather[0].main);

        // STEP 5: Aggregate all data
        const aggregatedData = {
            city: cityInfo.city,
            country: countryName,
            population: formattedPopulation,
            weather: weatherData.weather[0].description,
            temp: Math.round(weatherData.main.temp),
            feelsLike: Math.round(weatherData.main.feels_like),
            humidity: weatherData.main.humidity,
            weatherMain: weatherData.weather[0].main,
            weatherIcon: weatherIcon,
            currencyCode: currencyCode,
            currencyName: currencyName,
            rateToUSD: rateToUSD,
            timezone: cityInfo.timezone,
            latitude: cityInfo.latitude,
            longitude: cityInfo.longitude,
            rawPopulation: cityInfo.population
        };

        // STEP 6: Display results
        displayResults(aggregatedData);

        // STEP 7: Save to backend
        const saveSuccess = await sendDataToBackend(aggregatedData);
        
        if (saveSuccess) {
            // Refresh statistics after successful save
            loadStatistics();
        }

    } catch (error) {
        console.error("Fetch error:", error);
        showError("Unable to fetch city data. Please check your connection and try again.");
    }
}

// Get appropriate weather icon
function getWeatherIcon(weatherCondition) {
    const icons = {
        'Clear': 'fas fa-sun',
        'Clouds': 'fas fa-cloud',
        'Rain': 'fas fa-cloud-rain',
        'Drizzle': 'fas fa-cloud-rain',
        'Thunderstorm': 'fas fa-bolt',
        'Snow': 'fas fa-snowflake',
        'Mist': 'fas fa-smog',
        'Smoke': 'fas fa-smog',
        'Haze': 'fas fa-smog',
        'Fog': 'fas fa-smog'
    };
    
    return icons[weatherCondition] || 'fas fa-cloud';
}

// Display results in the UI
function displayResults(data) {
    resultsDiv.innerHTML = `
        <div class="city-results">
            <div class="city-header">
                <h2>${data.city}, ${data.country}</h2>
                <p class="city-country">${data.latitude.toFixed(2)}°N, ${data.longitude.toFixed(2)}°E • ${data.timezone}</p>
                <div class="header-bg-icon">
                    <i class="fas fa-city"></i>
                </div>
            </div>
            
            <div class="city-details-grid">
                <div class="detail-card population-detail">
                    <i class="fas fa-users"></i>
                    <div class="detail-title">Population</div>
                    <div class="detail-value">${data.population}</div>
                    <div class="detail-subtext">Latest available data</div>
                </div>
                
                <div class="detail-card weather-detail">
                    <i class="${data.weatherIcon}"></i>
                    <div class="detail-title">Weather</div>
                    <div class="detail-value">${data.temp}°C</div>
                    <div class="detail-subtext">${data.weather} • Feels like ${data.feelsLike}°C • Humidity ${data.humidity}%</div>
                </div>
                
                <div class="detail-card currency-detail">
                    <i class="fas fa-money-bill-wave"></i>
                    <div class="detail-title">Currency</div>
                    <div class="detail-value">${data.currencyCode}</div>
                    <div class="detail-subtext">${data.currencyName}</div>
                </div>
                
                <div class="detail-card exchange-detail">
                    <i class="fas fa-exchange-alt"></i>
                    <div class="detail-title">Exchange Rate</div>
                    <div class="detail-value">${data.rateToUSD}</div>
                    <div class="detail-subtext">1 ${data.currencyCode} = ${data.rateToUSD} USD</div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button onclick="saveToFavorites('${data.city}', '${data.country}')" class="action-button favorite-btn">
                    <i class="fas fa-heart"></i> Save to Favorites
                </button>
                <button onclick="shareCityData('${data.city}', '${data.country}', ${data.temp})" class="action-button share-btn">
                    <i class="fas fa-share-alt"></i> Share
                </button>
                <button onclick="resetSearch()" class="action-button reset-btn">
                    <i class="fas fa-search"></i> Search Another City
                </button>
            </div>
        </div>
    `;
}

// Function to send data to backend
async function sendDataToBackend(cityData) {
    try {
        // Ensure we have a valid token
        if (!AUTH_TOKEN) {
            const tokenSuccess = await getAuthToken();
            if (!tokenSuccess) {
                console.warn('Cannot save data: Authentication failed');
                return false;
            }
        }

        // Prepare data for backend
        const backendData = {
            city: cityData.city,
            country: cityData.country,
            population: cityData.rawPopulation || cityData.population.replace(/,/g, ''),
            weather: {
                description: cityData.weather,
                temperature: cityData.temp,
                feelsLike: cityData.feelsLike,
                humidity: cityData.humidity,
                main: cityData.weatherMain
            },
            currency: {
                code: cityData.currencyCode,
                name: cityData.currencyName,
                rateToUSD: parseFloat(cityData.rateToUSD) || 0
            },
            coordinates: {
                latitude: cityData.latitude,
                longitude: cityData.longitude
            },
            timezone: cityData.timezone,
            apiKeyUsed: BACKEND_API_KEY
        };

        // Send to backend
        const saveResponse = await fetch(`${BACKEND_API_URL}/saveData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'X-API-Key': BACKEND_API_KEY
            },
            body: JSON.stringify(backendData)
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
            showNotification('City data saved successfully!', 'success');
            console.log('Data saved to backend with ID:', saveResult.data.id);
            return true;
        } else {
            console.error('Failed to save data:', saveResult.message);
            showNotification('Failed to save data to server', 'error');
            return false;
        }
        
    } catch (error) {
        console.error('Error sending data to backend:', error);
        showNotification('Network error while saving data', 'error');
        return false;
    }
}

// Function to fetch saved records
async function fetchSavedRecords(page = 1, limit = 5) {
    try {
        if (!AUTH_TOKEN) {
            await getAuthToken();
        }
        
        const response = await fetch(`${BACKEND_API_URL}/records?page=${page}&limit=${limit}&sortBy=timestamp&order=desc`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'X-API-Key': BACKEND_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Failed to fetch records:', data.message);
            return [];
        }
        
    } catch (error) {
        console.error('Error fetching records:', error);
        return [];
    }
}

// Function to fetch statistics
async function fetchStatistics() {
    try {
        if (!AUTH_TOKEN) {
            await getAuthToken();
        }
        
        const response = await fetch(`${BACKEND_API_URL}/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'X-API-Key': BACKEND_API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            console.error('Failed to fetch statistics:', data.message);
            return null;
        }
        
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return null;
    }
}

// Load and display statistics
async function loadStatistics() {
    try {
        // Show loading state on refresh button
        if (refreshStatsBtn) {
            const originalHTML = refreshStatsBtn.innerHTML;
            refreshStatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            refreshStatsBtn.disabled = true;
            
            const stats = await fetchStatistics();
            
            // Restore button
            refreshStatsBtn.innerHTML = originalHTML;
            refreshStatsBtn.disabled = false;
            
            if (stats) {
                updateStatisticsUI(stats);
            }
        } else {
            const stats = await fetchStatistics();
            if (stats) {
                updateStatisticsUI(stats);
            }
        }
        
        // Also load recent searches
        loadRecentSearches();
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        if (refreshStatsBtn) {
            refreshStatsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Statistics';
            refreshStatsBtn.disabled = false;
        }
    }
}

// Update statistics UI
function updateStatisticsUI(stats) {
    // Update overview statistics
    if (stats.overview) {
        document.getElementById('totalSearches').textContent = 
            stats.overview.totalSearches || 0;
        document.getElementById('uniqueCities').textContent = 
            stats.overview.uniqueCities || 0;
        document.getElementById('avgTemp').textContent = 
            stats.overview.avgTemperature ? `${stats.overview.avgTemperature}°C` : '0°C';
        document.getElementById('uniqueCountries').textContent = 
            stats.overview.uniqueCountries || 0;
    }
    
    // Update popular cities
    if (stats.popularCities && stats.popularCities.length > 0) {
        const popularCitiesList = document.getElementById('popularCitiesList');
        if (popularCitiesList) {
            popularCitiesList.innerHTML = stats.popularCities.map(city => `
                <div class="popular-city-item">
                    <span class="city-name">${city._id}</span>
                    <span class="search-count">${city.count} searches</span>
                </div>
            `).join('');
        }
    }
}

// Load and display recent searches
async function loadRecentSearches() {
    const recentSearches = await fetchSavedRecords(1, 5);
    const recentSearchesList = document.getElementById('recentSearchesList');
    
    if (!recentSearchesList) return;
    
    if (recentSearches.length === 0) {
        recentSearchesList.innerHTML = `
            <p class="empty-message">No recent searches yet. Search for a city to see history here.</p>
        `;
        return;
    }
    
    recentSearchesList.innerHTML = recentSearches.map(record => `
        <div class="search-history-item" onclick="loadCityFromHistory('${record.city}', '${record.country}')">
            <div class="search-history-city">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                    <strong>${record.city}</strong>
                    <span>${record.country}</span>
                </div>
            </div>
            <div class="search-history-details">
                <span class="temperature">${record.weather.temperature}°C</span>
                <span class="timestamp">${formatTimestamp(record.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

// Load city from history
function loadCityFromHistory(city, country) {
    cityInput.value = city;
    handleSearch();
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Fetch city suggestions
async function fetchCitySuggestions(query) {
    try {
        const res = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=5`, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": "3a4fe67632msha3786569032db66p138315jsnd853d8b848de",
                "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
            }
        });
        
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
            showSuggestions(data.data);
        } else {
            suggestionsDiv.style.display = 'none';
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
}

// Show city suggestions
function showSuggestions(cities) {
    suggestionsDiv.innerHTML = '';
    
    cities.forEach(city => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        suggestionItem.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <div class="suggestion-text">
                <div class="suggestion-city">${city.city}</div>
                <div class="suggestion-country">${city.country}, ${city.region}</div>
            </div>
        `;
        
        suggestionItem.addEventListener('click', () => {
            cityInput.value = city.city;
            suggestionsDiv.style.display = 'none';
            handleSearch();
        });
        
        suggestionsDiv.appendChild(suggestionItem);
    });
    
    suggestionsDiv.style.display = 'block';
}

// Save city to favorites (local storage)
function saveToFavorites(city, country) {
    try {
        const favorites = JSON.parse(localStorage.getItem('cityFavorites')) || [];
        
        // Check if already favorited
        const alreadyExists = favorites.some(fav => 
            fav.city === city && fav.country === country
        );
        
        if (!alreadyExists) {
            favorites.push({
                city,
                country,
                savedAt: new Date().toISOString()
            });
            
            localStorage.setItem('cityFavorites', JSON.stringify(favorites));
            showNotification(`${city} added to favorites!`, 'success');
        } else {
            showNotification(`${city} is already in favorites`, 'info');
        }
    } catch (error) {
        console.error('Error saving favorite:', error);
        showNotification('Failed to save to favorites', 'error');
    }
}

// Share city data
function shareCityData(city, country, temperature) {
    const shareText = `Check out ${city}, ${country}! Current temperature: ${temperature}°C. Discovered via City Insights Dashboard.`;
    
    if (navigator.share) {
        navigator.share({
            title: `${city}, ${country} Insights`,
            text: shareText,
            url: window.location.href
        });
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('City info copied to clipboard!', 'success');
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                          type === 'error' ? 'exclamation-circle' : 
                          'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Export city data as JSON
function exportCityData(cityData) {
    const dataStr = JSON.stringify(cityData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${cityData.city}_${cityData.country}_insights.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Clear all history (admin function)
async function clearAllHistory() {
    if (confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
        try {
            // This would require an admin endpoint in the backend
            // For now, just clear local UI
            showNotification('History cleared', 'info');
            loadStatistics();
        } catch (error) {
            console.error('Error clearing history:', error);
            showNotification('Failed to clear history', 'error');
        }
    }
}

// Add CSS for new elements
const additionalCSS = `
.action-buttons {
    display: flex;
    gap: 15px;
    padding: 20px;
    background: #f8f9fa;
    border-top: 1px solid #eee;
    justify-content: center;
}

.action-button {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
}

.favorite-btn {
    background: linear-gradient(to right, #e74c3c, #c0392b);
    color: white;
}

.share-btn {
    background: linear-gradient(to right, #3498db, #2980b9);
    color: white;
}

.reset-btn {
    background: linear-gradient(to right, #95a5a6, #7f8c8d);
    color: white;
}

.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.search-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: white;
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 4px solid #6c5ce7;
}

.search-history-item:hover {
    background: #f8f9fa;
    transform: translateX(5px);
}

.search-history-city {
    display: flex;
    align-items: center;
    gap: 12px;
}

.search-history-city i {
    color: #6c5ce7;
    font-size: 1.2rem;
}

.search-history-city strong {
    display: block;
    color: #2c3e50;
}

.search-history-city span {
    font-size: 0.9rem;
    color: #7f8c8d;
}

.search-history-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
}

.temperature {
    font-weight: 600;
    color: #3498db;
    font-size: 1.1rem;
}

.timestamp {
    font-size: 0.85rem;
    color: #95a5a6;
}

.popular-city-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
}

.city-name {
    font-weight: 600;
    color: #2c3e50;
}

.search-count {
    color: #6c5ce7;
    font-weight: 500;
}

.empty-message {
    text-align: center;
    color: #95a5a6;
    font-style: italic;
    padding: 20px;
}

.stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transition: transform 0.3s;
}

.stat-card:hover {
    transform: translateY(-5px);
}

.stat-card i {
    font-size: 2.5rem;
    color: #6c5ce7;
    margin-bottom: 15px;
}

.stat-card h3 {
    font-size: 2rem;
    color: #2c3e50;
    margin: 10px 0;
}

.stat-card p {
    color: #7f8c8d;
    font-size: 0.9rem;
}

.refresh-button {
    background: linear-gradient(to right, #2ecc71, #27ae60);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    transition: all 0.3s;
}

.refresh-button:hover {
    background: linear-gradient(to right, #27ae60, #219653);
    transform: translateY(-2px);
}

.refresh-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
    }
    
    .search-history-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    
    .search-history-details {
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
    }
}
`;

// Add additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Make functions available globally for HTML onclick handlers
window.resetSearch = resetSearch;
window.saveToFavorites = saveToFavorites;
window.shareCityData = shareCityData;
window.loadCityFromHistory = loadCityFromHistory;
window.exportCityData = exportCityData;
window.clearAllHistory = clearAllHistory;

// Initialize notification CSS
const notificationCSS = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
}

.notification.success {
    background: linear-gradient(to right, #2ecc71, #27ae60);
}

.notification.info {
    background: linear-gradient(to right, #3498db, #2980b9);
}

.notification.error {
    background: linear-gradient(to right, #e74c3c, #c0392b);
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
    opacity: 0.8;
}

.notification button:hover {
    opacity: 1;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
`;

const notificationStyle = document.createElement('style');
notificationStyle.textContent = notificationCSS;
document.head.appendChild(notificationStyle);

// Log startup message
console.log('City Insights Dashboard initialized with backend integration');