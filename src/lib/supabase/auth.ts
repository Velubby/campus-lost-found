import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  phone_number?: string | null;
  student_number?: string | null;
  faculty?: string | null;
  study_program?: string | null;
  role?: string | null;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  const supabase = createClient();
  let targetId = userId;

  if (!targetId) {
    const user = await getCurrentUser();
    if (!user) return null;
    targetId = user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, student_number, faculty, study_program, role')
    .eq('id', targetId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    phone_number: data.phone,
  } as UserProfile;
}

export async function signInUser(email: string, password: string) {
  const supabase = createClient();
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpUser(data: {
  email: string;
  password: string;
  fullName: string;
  studentNumber?: string;
  faculty?: string;
  studyProgram?: string;
  phoneNumber?: string;
}) {
  const supabase = createClient();
  return await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        student_number: data.studentNumber,
        faculty: data.faculty,
        study_program: data.studyProgram,
        phone_number: data.phoneNumber,
      },
    },
  });
}

export async function signOutUser() {
  const supabase = createClient();
  return await supabase.auth.signOut();
}

export async function updateUserProfile(profile: {
  full_name?: string;
  phone?: string;
  phone_number?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Pengguna belum masuk');

  const supabase = createClient();
  const phoneVal = profile.phone ?? profile.phone_number;
  const updateData: Record<string, string | null> = {};
  if (profile.full_name !== undefined) updateData.full_name = profile.full_name;
  if (phoneVal !== undefined) updateData.phone = phoneVal;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) throw error;
  return true;
}

export async function checkIsStaff(userId?: string): Promise<boolean> {
  const profile = await getUserProfile(userId);
  return profile?.role?.toLowerCase() === 'satpam';
}
