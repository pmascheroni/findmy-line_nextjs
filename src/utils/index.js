const ROUTES = {
  Home: "/",
  Account: "/account",
  About: "/about",
  AdminInvites: "/admin/invites",
  BetCheckout: "/bet-checkout",
  GameDetail: "/game",
  Invite: "/invite",
  LiveTest: "/live-test",
  Pricing: "/pricing",
  Success: "/success",
};

export function createPageUrl(pageName) {
  if (!pageName) return "/";
  return ROUTES[pageName] || `/${String(pageName).replace(/\s+/g, "-").toLowerCase()}`;
}
