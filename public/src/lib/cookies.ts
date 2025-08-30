// Cookie utility functions for partner ID and admin authentication storage

const PARTNER_ID_COOKIE = 'partner_id';
const ADMIN_AUTH_COOKIE = 'admin_auth';
const COOKIE_EXPIRY_HOURS = 24;

export const setPartnerIdCookie = (partnerId: string): void => {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (COOKIE_EXPIRY_HOURS * 60 * 60 * 1000));
  
  const cookieValue = `${PARTNER_ID_COOKIE}=${partnerId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  document.cookie = cookieValue;
  
  console.log(`Cookie set: ${PARTNER_ID_COOKIE}=${partnerId}, expires: ${expiryDate.toUTCString()}`);
  console.log(`Full cookie string: ${cookieValue}`);
  console.log(`All cookies after setting: ${document.cookie}`);
};

export const getPartnerIdCookie = (): string | null => {
  console.log(`Getting cookie. All cookies: ${document.cookie}`);
  const cookies = document.cookie.split(';');
  console.log(`Split cookies:`, cookies);
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    console.log(`Checking cookie: name="${name}", value="${value}"`);
    if (name === PARTNER_ID_COOKIE && value) {
      console.log(`Cookie found: ${PARTNER_ID_COOKIE}=${value}`);
      return value;
    }
  }
  
  console.log(`No cookie found for: ${PARTNER_ID_COOKIE}`);
  return null;
};

export const clearPartnerIdCookie = (): void => {
  const cookieValue = `${PARTNER_ID_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = cookieValue;
  console.log(`Cookie cleared: ${PARTNER_ID_COOKIE}`);
};

// Admin authentication cookie functions
export const setAdminAuthCookie = (password: string): void => {
  const expiryDate = new Date();
  expiryDate.setTime(expiryDate.getTime() + (COOKIE_EXPIRY_HOURS * 60 * 60 * 1000));
  
  const cookieValue = `${ADMIN_AUTH_COOKIE}=${password}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  document.cookie = cookieValue;
  
  console.log(`Admin auth cookie set: ${ADMIN_AUTH_COOKIE}=${password}, expires: ${expiryDate.toUTCString()}`);
};

export const getAdminAuthCookie = (): string | null => {
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === ADMIN_AUTH_COOKIE && value) {
      console.log(`Admin auth cookie found: ${ADMIN_AUTH_COOKIE}=${value}`);
      return value;
    }
  }
  
  console.log(`No admin auth cookie found for: ${ADMIN_AUTH_COOKIE}`);
  return null;
};

export const clearAdminAuthCookie = (): void => {
  const cookieValue = `${ADMIN_AUTH_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  document.cookie = cookieValue;
  console.log(`Admin auth cookie cleared: ${ADMIN_AUTH_COOKIE}`);
};
