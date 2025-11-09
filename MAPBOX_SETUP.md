# Mapbox Setup for Table.Review

To enable the interactive map on the homepage, you need to configure your Mapbox API key.

## Steps:

1. **Get a Mapbox API Key**
   - Go to [https://mapbox.com](https://mapbox.com)
   - Create a free account
   - Navigate to the **Tokens** section in your dashboard
   - Copy your **public token**

2. **Update the MapView Component**
   - Open `src/components/map/MapView.tsx`
   - Find line 8: `mapboxgl.accessToken = "pk.eyJ1...placeholder";`
   - Replace `"pk.eyJ1...placeholder"` with your actual Mapbox public token

3. **Example:**
   ```typescript
   mapboxgl.accessToken = "pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImFiYzEyMyJ9.your_actual_token";
   ```

4. **Save and Refresh**
   - The map will now load correctly on the homepage

## Security Note:
Mapbox public tokens are safe to use in client-side code. They can be restricted to specific domains in your Mapbox dashboard for added security.

## Lisbon Demo Data:
The app comes pre-configured to center on Lisbon, Portugal (coordinates: -9.1399, 38.7169) at zoom level 13. You can adjust this in `src/components/map/MapView.tsx` if needed.
