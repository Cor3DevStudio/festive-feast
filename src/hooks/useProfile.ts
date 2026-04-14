import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface UserProfile {
  id: string;
  is_admin: boolean;
  username: string | null;
  avatar_url: string | null;
  gender: string | null;
  birthday: string | null;
  full_name: string | null;
  phone: string | null;
  shipping_street: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
  billing_same_as_shipping: boolean;
  billing_street: string | null;
  billing_city: string | null;
  billing_province: string | null;
  billing_postal_code: string | null;
  updated_at: string | null;
  created_at: string | null;
}

export function useProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("useProfile:", error);
      setProfile(null);
    } else {
      setProfile(data as UserProfile | null);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [isAuthenticated, user?.id, fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}
