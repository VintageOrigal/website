const branches = {
    brackenfell: { name: "Brackenfell", lat: -33.8786, long: 18.7051, price: 100 },
    strand: { name: "Strand", lat: -34.1065, long: 18.8275, price: 120}
};

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPricesBasedOnLocation, showError);
    } else {
        document.getElementById('priceInfo').innerHTML = "Geoloaction is not supported by this browser.";
    }
}

function showPricesBasedOnLocation(position) {
    const userLat = position.coords.latitude;
    const userLong = position.coords.longitude;

    const distanceToBrackenfell = calculateDistance(userLat, userLong, branches.brackenfell.lat, branches.brackenfell.long);
    const distanceToStrand = calculateDistance(userLat, userLong, branches.strand.lat, branches.strand.long);

    let closestBranch;
    if (distanceToBrackenfell < distanceToStrand) {
        closestBranch = branches.brackenfell;
    } else {
        closestBranch = branches.strand;
    }

    document.getElementById('priceInfo').innerHTML = 'Closest branch: ${closestBranch.name} <br> Price: R${closestBranch.price}';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; //Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('priceInfo').innerHTML = "User denied the request for Location.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('priceInfo').innerHTML = "Location information is unavailible.";
            break;
        case error.TIMEOUT:
            document.getElementById('priceInfo').innerHTML = "The request to get user location has timmed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('priceInfo').innerHTML = "An unknown error occurred.";
            break;
    }
}