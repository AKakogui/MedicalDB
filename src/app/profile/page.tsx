
'use client';
import MyCases from '@/components/sections/my-cases';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  useAuth,
  useFirestore,
  useUser,
  useMemoFirebase,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, CircleUser, Loader, ShieldAlert, BadgeCheck, MailWarning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';


const profileSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email(),
    address: z.string().optional(),
    photoURL: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword || data.confirmNewPassword) {
        return !!data.currentPassword;
      }
      return true;
    },
    {
      message: 'Current password is required to change your password.',
      path: ['currentPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword) {
        return data.newPassword.length >= 6;
      }
      return true;
    },
    {
      message: 'New password must be at least 6 characters.',
      path: ['newPassword'],
    }
  )
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match.",
    path: ['confirmNewPassword'],
  });

function DeleteAccountSection() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !auth.currentUser) return;
    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Delete user document from Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await deleteDoc(userDocRef);

      // Note: This does not delete subcollections like appointments or medical records.
      // A Cloud Function would be needed for full data cleanup.

      // Delete user from Firebase Auth
      await deleteUser(auth.currentUser);

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });
      router.push('/signup');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete account.',
      });
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all of your content. This action
          is not reversible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete My Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form onSubmit={handleDeleteAccount}>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="text-destructive" />
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers,
                  including your profile, appointments, and medical records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-2">
                <Label htmlFor="password-confirm">
                  To confirm, please enter your password:
                </Label>
                <Input
                  id="password-confirm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setPassword('');
                    setError('');
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? (
                    <Loader className="animate-spin" />
                  ) : (
                    'Yes, delete my account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}


export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      photoURL: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const userDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );

  useEffect(() => {
    if (user && userDocRef) {
      const fetchUserProfile = async () => {
        setIsProfileLoading(true);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            form.reset({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: user.email || '',
              address: data.address || '',
              photoURL: user.photoURL || '',
            });
          } else {
            form.reset({
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              email: user.email || '',
              photoURL: user.photoURL || '',
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load your profile.' });
        } finally {
          setIsProfileLoading(false);
        }
      };
      fetchUserProfile();
    }
  }, [user, userDocRef, form, toast]);


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
  
    // ✅ Step 1: File size limit (2 MB)
    const maxSize = 2 * 1024 * 1024; // 2 MB in bytes
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
      });
      return;
    }
  
    // ✅ Step 2: Optional type check (optional but good hygiene)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPEG or PNG image only.',
      });
      return;
    }
  
    // ✅ Step 3: Proceed with upload (same as before)
    setIsUploading(true);
    try {
      // Simulate upload delay (replace with real Firebase Storage upload later if needed)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const newPhotoURL = URL.createObjectURL(file);
  
      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: newPhotoURL });


      // Update form state
      form.setValue('photoURL', newPhotoURL);
  
      toast({ title: 'Success', description: 'Profile picture updated!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
      toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
    } finally {
      setIsUploading(false);
    }
  };
  

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setIsSendingVerification(true);

    sendEmailVerification(auth.currentUser)
      .then(() => {
        toast({
          title: 'Verification email sent',
          description: "Please check your inbox (and spam folder) to verify your email address.",
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: `users/${auth.currentUser?.uid}`,
          operation: 'write', // conceptual operation
          requestResourceData: { action: 'sendEmailVerification' },
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSendingVerification(false);
      });
  };

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !auth.currentUser || !userDocRef) return;

    setIsLoading(true);
    try {
      // Update password if fields are filled
      if (values.newPassword && values.currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email!,
          values.currentPassword
        );
        // Re-authenticate before updating password
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, values.newPassword);
        toast({ title: 'Success', description: 'Password updated successfully.' });
      }

      // Update Firestore document
      await setDoc(
        userDocRef,
        {
          address: values.address,
        },
        { merge: true }
      );

      toast({ title: 'Success', description: 'Profile updated successfully.' });
      form.reset({
        ...form.getValues(),
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const photoURL = form.watch('photoURL');

  // Test
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Manage your personal information and account settings.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {isProfileLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Loader className="size-24 animate-spin text-primary" />
                        <div className="space-y-2">
                          <p>Loading profile...</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="photoURL"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-24 w-24">
                                <AvatarImage src={photoURL} alt="User avatar" />
                                <AvatarFallback>
                                  <CircleUser className="h-12 w-12" />
                                </AvatarFallback>
                              </Avatar>
                              <Button asChild variant="outline">
                                <label htmlFor="photo-upload" className="cursor-pointer">
                                  {isUploading ? (
                                    <>
                                      <Loader className="animate-spin" /> Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Camera /> Change Picture
                                    </>
                                  )}
                                </label>
                              </Button>
                              <FormControl>
                                <Input
                                  id="photo-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  disabled={isUploading}
                                />
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane" {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Doe" {...field} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {user && (
                        <div className="rounded-md border p-3 bg-card">
                          {user.emailVerified ? (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <BadgeCheck className="size-5" />
                              <span>Email address verified.</span>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              <div className="flex items-center gap-2 text-sm text-amber-600">
                                <MailWarning className="size-5" />
                                <span>Email address not verified.</span>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleResendVerification}
                                disabled={isSendingVerification}
                                className="sm:ml-auto"
                              >
                                {isSendingVerification ? (
                                  <>
                                    <Loader className="animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  'Resend Verification Email'
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}


                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, Anytown USA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <h3 className="mb-4 text-lg font-medium">Change Password</h3>
                        <div className="space-y-4 rounded-md border p-4">
                          <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmNewPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading || isProfileLoading}>
                    {isLoading ? <Loader className="animate-spin" /> : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
          {/* ===== My Cases Section ===== */}
          <Card>
            <CardHeader>
              <CardTitle>My Cases</CardTitle>
              <CardDescription>View your submitted medical cases and their status.</CardDescription>
            </CardHeader>
            <CardContent>
              <MyCases />
            </CardContent>
          </Card>


          <DeleteAccountSection />
        </div>
      </main>
    </div>
  );
}
