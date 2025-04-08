import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignIn from "@/components/auth/sign-in";
import SignUp from "@/components/auth/sign-up";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - MyDiary",
  description: "Sign in or create an account for MyDiary",
};

export default function AuthPage() {
  return (
    <section className="flex items-center justify-center min-h-screen py-12 bg-slate-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Welcome to MyDiary
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Sign in to your account or create a new one to get started.
            </p>
          </div>
          
          <div className="w-full max-w-md mx-auto">
            <Tabs defaultValue="sign-in" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="sign-in" className="mt-4">
                <SignIn />
              </TabsContent>
              <TabsContent value="sign-up" className="mt-4">
                <SignUp />
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
