/**
 * frontend/lib/services/auth-service.ts
 * =====================================
 * Client & server authentication helper for AeroSync SaaS.
 */

import { User, Organization } from "../types";
import { aeroSyncStore, DEMO_USER, DEMO_ORG } from "../store";

export interface AuthResponse {
  success: boolean;
  user?: User;
  org?: Organization;
  error?: string;
  token?: string;
}

export class AuthService {
  public static async login(email: string, password?: string): Promise<AuthResponse> {
    // For demo / local workspace
    if (email.toLowerCase().includes("demo") || email.toLowerCase() === "vivek@aerosync.io") {
      aeroSyncStore.login(DEMO_USER, DEMO_ORG);
      return {
        success: true,
        user: DEMO_USER,
        org: DEMO_ORG,
        token: "tok_demo_live_session_9921",
      };
    }

    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    const state = aeroSyncStore.getState();
    const existingUser = state.currentUser?.email === email ? state.currentUser : null;
    const existingOrg = state.currentOrg;

    if (existingUser && existingOrg) {
      aeroSyncStore.login(existingUser, existingOrg);
      return { success: true, user: existingUser, org: existingOrg, token: `tok_${Date.now()}` };
    }

    // Auto-create workspace for real user if not found
    const newUser: User = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      email,
      fullName: email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim() || "AeroSync User",
      isEmailVerified: true,
      role: "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newOrg: Organization = {
      id: `org-${Date.now().toString().slice(-6)}`,
      name: `${newUser.fullName}'s Workspace`,
      slug: `ws-${Date.now().toString().slice(-4)}`,
      ownerId: newUser.id,
      state: "Gujarat",
      persona: "LANDOWNER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    aeroSyncStore.login(newUser, newOrg);
    return { success: true, user: newUser, org: newOrg, token: `tok_${Date.now()}` };
  }

  public static async register(
    email: string,
    fullName: string,
    password?: string,
    persona: Organization["persona"] = "LANDOWNER"
  ): Promise<AuthResponse> {
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }
    if (!fullName || fullName.length < 2) {
      return { success: false, error: "Please provide your full name." };
    }

    const userId = `usr-${Date.now().toString().slice(-6)}`;
    const orgId = `org-${Date.now().toString().slice(-6)}`;

    const user: User = {
      id: userId,
      email,
      fullName,
      isEmailVerified: false,
      role: "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const org: Organization = {
      id: orgId,
      name: `${fullName.split(" ")[0]}'s Workspace`,
      slug: `ws-${Date.now().toString().slice(-4)}`,
      ownerId: userId,
      state: "Gujarat",
      persona,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    aeroSyncStore.login(user, org);
    aeroSyncStore.addNotification({
      title: "Welcome to AeroSync!",
      message: "Please verify your email address and start by adding your first property.",
      type: "INFO",
      linkHref: "/verify-email",
    });

    return {
      success: true,
      user,
      org,
      token: `tok_reg_${Date.now()}`,
    };
  }

  public static logout(): void {
    aeroSyncStore.logout();
  }
}
