// Global variable to store the current app definition
let appDefinition = null;

/**
 * Vincent MCP Server - App Definition Display
 *
 * This script fetches the app definition from the server and displays it
 * in a user-friendly format, including the app details and available tools.
 */

/**
 * Decodes a JWT token
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded token payload or null if invalid
 */
function decodeJwt(token) {
  try {
    // Split the token into its parts
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters and decode
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

/**
 * Checks if a JWT token is expired
 * @param {Object} decodedToken - The decoded JWT token
 * @returns {boolean} True if expired, false otherwise
 */
function isTokenExpired(decodedToken) {
  if (!decodedToken || !decodedToken.exp) return true;
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
}

/**
 * Gets the storage key for the JWT token based on app ID
 * @param {string} appId - The application ID
 * @returns {string} The storage key
 */
function getJwtStorageKey(appId) {
  return `vincent-${appId}`;
}

/**
 * Saves the JWT token to localStorage
 * @param {string} appId - The application ID
 * @param {string} token - The JWT token to save
 */
function saveJwtToken(appId, token) {
  if (!appId || !token) return;
  const key = getJwtStorageKey(appId);
  try {
    localStorage.setItem(key, token);
  } catch (e) {
    console.error('Error saving JWT to localStorage:', e);
  }
}

/**
 * Loads the JWT token from localStorage and validates it
 * @param {string} appId - The application ID
 * @returns {string|null} The valid JWT token or null if not found or expired
 */
function loadJwtToken(appId) {
  if (!appId) return null;
  const key = getJwtStorageKey(appId);
  try {
    const token = localStorage.getItem(key);
    if (!token) return null;

    // Check if token is expired
    const decoded = decodeJwt(token);
    if (isTokenExpired(decoded)) {
      // Remove expired token
      localStorage.removeItem(key);
      return null;
    }

    return token;
  } catch (e) {
    console.error('Error loading JWT from localStorage:', e);
    return null;
  }
}

function showMCPConnectionModal() {
  if (!appDefinition?.id) return;

  const jwtToken = localStorage.getItem(getJwtStorageKey(appDefinition.id));
  if (!jwtToken) return;

  const modal = document.getElementById('mcp-modal');
  const connectionLink = document.getElementById('mcp-connection-link');
  const modalAppName = document.getElementById('modal-app-name');

  if (!modal || !connectionLink || !modalAppName) return;

  modalAppName.textContent = appDefinition.name || 'Vincent App';

  const connectionUrl = `${window.location.origin}/mcp?jwt=${encodeURIComponent(jwtToken)}`;
  connectionLink.value = connectionUrl;

  // Show the modal
  modal.classList.add('show');

  // Select the text in the input. Ready to be copied.
  connectionLink.select();

  const copyButton = document.getElementById('copy-link-btn');
  if (copyButton) {
    copyButton.onclick = () => {
      navigator.clipboard.writeText(connectionUrl).then(() => {
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '✓ Copied!';
        copyButton.style.minWidth = '80px';
        setTimeout(() => {
          copyButton.innerHTML = originalText;
          copyButton.style.minWidth = '';
        }, 2000);
      });
    };
  }
}

function closeModal() {
  const modal = document.getElementById('mcp-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function initModal() {
  // Close modal when clicking the close button or outside the modal
  document.querySelectorAll('.close-modal').forEach((button) => {
    button.addEventListener('click', closeModal);
  });

  const modal = document.getElementById('mcp-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Vincent MCP landing page script loaded.');

  const appName = document.getElementById('app-name');
  const appDescription = document.getElementById('app-description');
  const appVersion = document.getElementById('app-version');
  const toolsContainer = document.getElementById('tools-container');
  const approveButton = document.getElementById('approve-button');
  const connectButton = document.getElementById('connect-button');

  function updateConnectButtonState() {
    if (!connectButton) return;

    const hasValidJwt = !!localStorage.getItem(getJwtStorageKey(appDefinition?.id));
    connectButton.disabled = !hasValidJwt;

    if (hasValidJwt) {
      connectButton.removeAttribute('title');
    } else {
      connectButton.setAttribute('title', 'You must approve Vincent App first');
    }
  }

  function displayPkpAddress(decodedToken) {
    if (!decodedToken?.pkp?.ethAddress) return;

    const existingContainer = document.querySelector('.pkp-address-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    const container = document.createElement('div');
    container.className = 'pkp-address-container';

    const label = document.createElement('div');
    label.className = 'pkp-address-label';
    label.textContent = 'Approved Vincent App with PKP:';

    const address = document.createElement('div');
    address.className = 'pkp-address';
    address.textContent = decodedToken.pkp.ethAddress;
    address.title = decodedToken.pkp.ethAddress; // Show full address on hover

    container.appendChild(label);
    container.appendChild(address);

    const appActions = document.querySelector('.app-actions');
    if (appActions && appActions.parentNode) {
      appActions.parentNode.insertBefore(container, appActions.nextSibling);
    }
  }

  try {
    const response = await fetch('/appDef');
    if (!response.ok) {
      throw new Error(`Failed to load app definition: ${response.status} ${response.statusText}`);
    }

    appDefinition = await response.json();
    displayAppDefinition(appDefinition);

    // Check for JWT in URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    let jwtToken = urlParams.get('jwt');
    let decodedToken = null;

    if (jwtToken) {
      console.log('JWT token found in URL');
      // Clean up the URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Decode the token to get the app ID and check expiration
      decodedToken = decodeJwt(jwtToken);
      if (decodedToken && !isTokenExpired(decodedToken)) {
        // Save the token with the app ID from the token
        const tokenAppId = decodedToken.app?.id;
        if (tokenAppId) {
          saveJwtToken(tokenAppId, jwtToken);
        }
      }
    } else {
      if (appDefinition?.id) {
        const savedToken = loadJwtToken(appDefinition.id);
        if (savedToken) {
          jwtToken = savedToken;
          decodedToken = decodeJwt(jwtToken);
        }
      }
    }

    // Handle valid JWT token
    if (jwtToken && decodedToken && !isTokenExpired(decodedToken)) {
      updateConnectButtonState();
      displayPkpAddress(decodedToken);
    }

    if (approveButton) {
      approveButton.addEventListener('click', () => {
        if (appDefinition?.id) {
          const currentUrl = encodeURIComponent(window.location.origin);
          window.location.href = `https://dashboard.heyvincent.ai/appId/${appDefinition.id}/consent?redirectUri=${currentUrl}`;
        } else {
          console.error('App definition not loaded');
        }
      });
    }

    if (connectButton) {
      connectButton.addEventListener('click', showMCPConnectionModal);
      updateConnectButtonState();
    }

    initModal();
  } catch (error) {
    console.error('Error loading app definition:', error);
    appName.textContent = 'Error loading app definition';
    appDescription.textContent =
      'Failed to load the application definition. Please try again later.';
  }
});

/**
 * Displays the app definition on the page
 * @param {Object} appDef - The app definition object
 */
function displayAppDefinition(appDef) {
  const { name, description, version, tools } = appDef;

  document.getElementById('app-name').textContent = name;
  document.getElementById('app-description').textContent = description;
  document.getElementById('app-version').textContent = `v${version}`;

  const toolsContainer = document.getElementById('tools-container');
  toolsContainer.innerHTML = '';

  Object.values(tools).forEach((tool) => {
    const toolElement = createToolElement(tool);
    toolsContainer.appendChild(toolElement);
  });
}

/**
 * Creates a DOM element for a tool
 * @param {Object} tool - The tool object
 * @returns {HTMLElement} The created tool element
 */
function createToolElement(tool) {
  const toolElement = document.createElement('div');
  toolElement.className = 'tool-card';

  toolElement.innerHTML = `
    <h3 class="tool-name">${escapeHtml(tool.name)}</h3>
    <p class="tool-description">${escapeHtml(tool.description)}</p>
  `;

  if (tool.parameters && tool.parameters.length > 0) {
    const parametersTitle = document.createElement('div');
    parametersTitle.className = 'parameters-title';
    parametersTitle.textContent = 'Parameters';
    toolElement.appendChild(parametersTitle);

    const parametersList = document.createElement('div');

    tool.parameters.forEach((param) => {
      const paramElement = document.createElement('div');
      paramElement.className = 'parameter-item';

      const nameElement = document.createElement('div');
      nameElement.className = 'parameter-name';
      nameElement.innerHTML = `
        ${escapeHtml(param.name)}
        <span class="parameter-type">${escapeHtml(param.type)}</span>
      `;

      const descElement = document.createElement('div');
      descElement.className = 'parameter-description';
      descElement.textContent = param.description || 'No description provided.';

      paramElement.appendChild(nameElement);
      paramElement.appendChild(descElement);
      parametersList.appendChild(paramElement);
    });

    toolElement.appendChild(parametersList);
  }

  return toolElement;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe - The unsafe string
 * @returns {string} The escaped string
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
