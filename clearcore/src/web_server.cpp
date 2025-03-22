#include "web_server.h"

// Constructor
WebServer::WebServer(uint16_t port) : _server(port), _initialized(false), _port(port) {
    // Initialize IP string buffer
    _ipString[0] = '\0';
}

// Initialize the web server
bool WebServer::init() {
    // We don't need to initialize Ethernet again if it's already done
    // Just get the IP address for reference
    ClearCore::EthernetManager& ethernetManager = ClearCore::EthernetManager::Instance();

    // Format the IP address as a string
    ClearCore::IpAddress ip = ethernetManager.LocalIp();
    strncpy(_ipString, ip.StringValue(), sizeof(_ipString) - 1);
    _ipString[sizeof(_ipString) - 1] = '\0';  // Ensure null termination

    // Start the server
    _server.Begin();

#ifdef DEBUG
    Serial.print("Web server initialized on ");
    Serial.print(_ipString);
    Serial.print(":");
    Serial.println(_port);
#endif

    _initialized = true;
    return true;
}

// Update method (called in main loop)
void WebServer::update() {
    // Check for new client connections
    _client = _server.Available();

    if (_client.Connected()) {
        handleClient();
    }
}

// Get server's IP address
const char* WebServer::getIpAddressString() {
    return _ipString;
}

// Handle client connection
void WebServer::handleClient() {
    // Buffer to store the HTTP request
    String request = "";
    unsigned long startTime = millis();

    // Read the HTTP request line by line
    while (_client.Connected() && (millis() - startTime < 1000)) {
        if (_client.BytesAvailable() > 0) {
            char c = _client.Read();
            request += c;

            // If we've reached the end of the HTTP request headers
            if (request.indexOf("\r\n\r\n") != -1) {
                break;
            }
        }
    }

    // If we got a valid request, parse and handle it
    if (request.length() > 0) {
        parseRequest(request);
    }

    // Close the connection
    _client.Close();
}

// Parse HTTP request
void WebServer::parseRequest(const String& request) {
    // Check if it's a GET request
    if (request.startsWith("GET")) {
        // Extract the requested path
        String path = getPath(request);

        // Decode URL-encoded characters
        path = urlDecode(path);

        // If the path is empty or root, show the root directory
        if (path.length() == 0 || path == "/") {
            sendDirectoryListing("/");
            return;
        }

        // Check if the path is a directory or file
        if (path.endsWith("/")) {
            // It's a directory, show listing
            sendDirectoryListing(path);
        } else {
            // It's a file, try to send it
            String contentType = getContentType(path);
            sendFile(path, contentType);
        }
    } else {
        // Only support GET requests for read-only access
        sendResponse("405 Method Not Allowed", "text/plain", "Only GET method is supported");
    }
}

// Send HTTP response
void WebServer::sendResponse(const String& status, const String& contentType,
                             const String& content) {
    String response = "HTTP/1.1 " + status + "\r\n";
    response += "Content-Type: " + contentType + "\r\n";
    response += "Connection: close\r\n";
    response += "Content-Length: " + String(content.length()) + "\r\n";
    response += "\r\n";
    response += content;

    _client.Send((const uint8_t*)response.c_str(), response.length());
}

// Send a file from SD card
void WebServer::sendFile(const String& path, const String& contentType) {
    // Remove leading slash
    String sdPath = path;
    if (sdPath.startsWith("/")) {
        sdPath = sdPath.substring(1);
    }

    // Check if file exists
    if (!SD.exists(sdPath.c_str())) {
        send404();
        return;
    }

    // Open the file
    File file = SD.open(sdPath.c_str());
    if (!file) {
        send404();
        return;
    }

    // Send HTTP header
    String header = "HTTP/1.1 200 OK\r\n";
    header += "Content-Type: " + contentType + "\r\n";
    header += "Connection: close\r\n";
    header += "Content-Length: " + String(file.size()) + "\r\n";
    header += "\r\n";

    _client.Send((const uint8_t*)header.c_str(), header.length());

    // Send file content in chunks
    const size_t bufferSize = 512;
    uint8_t buffer[bufferSize];

    while (file.available()) {
        size_t bytesRead = file.read(buffer, bufferSize);
        if (bytesRead > 0) {
            _client.Send(buffer, bytesRead);
        }
    }

    file.close();
}

// Send directory listing
void WebServer::sendDirectoryListing(const String& path) {
    // Remove leading slash for SD card path
    String sdPath = path;
    if (sdPath.startsWith("/")) {
        sdPath = sdPath.substring(1);
    }

    // If path is empty, we're at the root
    if (sdPath.length() == 0) {
        sdPath = "/";
    }

    // Open the directory
    File dir;
    if (sdPath == "/") {
        dir = SD.open("/");
    } else {
        dir = SD.open(sdPath.c_str());
    }

    // Check if it's a valid directory
    if (!dir || !dir.isDirectory()) {
        send404();
        return;
    }

    // Start creating HTML content
    String content = "<!DOCTYPE html>\n";
    content += "<html><head><title>SD Card Browser - " + path + "</title>\n";
    content += "<style>\n";
    content += "body { font-family: Arial, sans-serif; margin: 20px; }\n";
    content += "h1 { color: #333; }\n";
    content += "ul { list-style-type: none; padding: 0; }\n";
    content += "li { margin: 5px 0; }\n";
    content += "a { text-decoration: none; color: #0066cc; }\n";
    content += "a:hover { text-decoration: underline; }\n";
    content += "li.directory a { font-weight: bold; }\n";
    content += "li.file a { }\n";
    content += "</style>\n";
    content += "</head><body>\n";
    content += "<h1>Directory: " + path + "</h1>\n";

    // Add parent directory link if not at root
    if (path != "/") {
        String parentPath = path.substring(0, path.lastIndexOf("/", path.length() - 2) + 1);
        if (parentPath.length() == 0) {
            parentPath = "/";
        }
        content += "<p><a href=\"" + parentPath + "\">[Parent Directory]</a></p>\n";
    }

    content += "<ul>\n";

    // List all files and directories
    File entry;
    while (entry = dir.openNextFile()) {
        String name = entry.name();
        String entryPath;

        // Handle root directory special case
        if (path == "/") {
            entryPath = "/" + name;
        } else {
            entryPath = path + name;
        }

        if (entry.isDirectory()) {
            content += "<li class=\"directory\"><a href=\"" + entryPath + "/\">[DIR] " + name +
                       "/</a></li>\n";
        } else {
            content += "<li class=\"file\"><a href=\"" + entryPath + "\">" + name + "</a> (" +
                       entry.size() + " bytes)</li>\n";
        }

        entry.close();
    }

    content += "</ul>\n";
    content += "<p><small>Space Maquette SD Card Browser</small></p>\n";
    content += "</body></html>";

    dir.close();

    // Send the response
    sendResponse("200 OK", "text/html", content);
}

// Send 404 Not Found response
void WebServer::send404() {
    String content = "<!DOCTYPE html>\n";
    content += "<html><head><title>404 Not Found</title></head><body>\n";
    content += "<h1>404 Not Found</h1>\n";
    content += "<p>The requested file was not found on the SD card.</p>\n";
    content += "<p><a href=\"/\">Return to home</a></p>\n";
    content += "</body></html>";

    sendResponse("404 Not Found", "text/html", content);
}

// Get MIME content type from file extension
String WebServer::getContentType(const String& filename) {
    // Default content type
    String contentType = "text/plain";

    // Check common file extensions
    if (filename.endsWith(".htm") || filename.endsWith(".html")) {
        contentType = "text/html";
    } else if (filename.endsWith(".css")) {
        contentType = "text/css";
    } else if (filename.endsWith(".js")) {
        contentType = "application/javascript";
    } else if (filename.endsWith(".json")) {
        contentType = "application/json";
    } else if (filename.endsWith(".png")) {
        contentType = "image/png";
    } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
        contentType = "image/jpeg";
    } else if (filename.endsWith(".gif")) {
        contentType = "image/gif";
    } else if (filename.endsWith(".ico")) {
        contentType = "image/x-icon";
    } else if (filename.endsWith(".xml")) {
        contentType = "text/xml";
    } else if (filename.endsWith(".pdf")) {
        contentType = "application/pdf";
    } else if (filename.endsWith(".zip")) {
        contentType = "application/zip";
    } else if (filename.endsWith(".txt") || filename.endsWith(".log")) {
        contentType = "text/plain";
    } else if (filename.endsWith(".csv")) {
        contentType = "text/csv";
    }

    return contentType;
}

// URL decode function
String WebServer::urlDecode(const String& text) {
    String decoded = "";
    char temp[3] = {0};

    for (size_t i = 0; i < text.length(); i++) {
        if (text[i] == '%') {
            if (i + 2 < text.length()) {
                temp[0] = text[i + 1];
                temp[1] = text[i + 2];
                decoded += (char)strtol(temp, NULL, 16);
                i += 2;
            }
        } else if (text[i] == '+') {
            decoded += ' ';
        } else {
            decoded += text[i];
        }
    }

    return decoded;
}

// Extract path from HTTP request
String WebServer::getPath(const String& request) {
    int startPos = request.indexOf("GET ") + 4;
    int endPos = request.indexOf(" HTTP/");

    if (startPos < 4 || endPos < 0 || startPos >= endPos) {
        return "/";
    }

    return request.substring(startPos, endPos);
}
