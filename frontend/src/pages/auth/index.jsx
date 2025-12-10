import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo } from "@/store/userSlice.js";
import { API_ENDPOINTS } from "@/lib/apiConfig";
import { Mail, Lock, Eye, EyeOff, MessageSquare, Sparkles, Shield, Zap } from "lucide-react";

// Moved outside Auth component to prevent re-creation on re-renders
const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20">
      <Icon className="w-4 h-4 text-violet-400" />
    </div>
    <div>
      <h4 className="text-sm font-medium text-white/90">{title}</h4>
      <p className="text-xs text-white/40 mt-0.5">{description}</p>
    </div>
  </div>
);

// Moved outside Auth component to prevent input losing focus on every keystroke
const InputField = ({ type, placeholder, value, onChange, icon: Icon, showToggle, isShown, onToggle }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <input
      type={showToggle ? (isShown ? "text" : "password") : type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full h-12 pl-12 pr-12 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/20 transition-all duration-300"
    />
    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
      >
        {isShown ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    )}
  </div>
);

function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Login");

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!isValidEmail(email)) {
      toast.error("Invalid email. Use a valid Gmail address.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    if (isStrongPassword(password)) {
      toast.error("Password must be at least 8 characters, include an uppercase letter, lowercase letter, a number, and a special character.");
      return false;
    }
    if (!confirmPassword.length) {
      toast.error("Confirmation Password is required");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Confirmation Password should be same as password");
      return false;
    }
    return true;
  };

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!isValidEmail(email)) {
      toast.error("Invalid email. Use a valid Gmail address.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      setIsLoading(true);
      try {
        const response = await axios.post(API_ENDPOINTS.user.Login, {email, password}, {withCredentials: true});
        
        if (response.data && response.data.user) {
          dispatch(setUserInfo(response.data.user));
          toast.success("Welcome back!");
          if(response.data.user.profileSetup) navigate("/chat");
          else navigate("/profile");
        } else {
          toast.error("Invalid response from server");
        }
      } catch (error) {
        if (error.response) {
          toast.error(error.response.data.msg || "Login failed. Please check your credentials.");
        } else if (error.request) {
          toast.error("Cannot connect to the server. Please try again later.");
        } else {
          toast.error("An error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      setIsLoading(true);
      try {
        const response = await axios.post(API_ENDPOINTS.user.signup, {email, password}, {withCredentials: true});
       
        if(response.status === 200) {
          dispatch(setUserInfo(response.data.newUser));
          toast.success("Account created successfully!");
          navigate("/profile");
        }
      } catch (error) {
        toast.error(error.response?.data?.msg || "Signup failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };


  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        {/* Left side - Branding */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">Real-time messaging</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">Connect with</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">YouChat</span>
          </h1>
          
          <p className="text-white/50 text-lg leading-relaxed">
            Experience seamless communication with our next-generation messaging platform powered by AI.
          </p>

          <div className="space-y-3 pt-4">
            <FeatureCard 
              icon={MessageSquare} 
              title="Instant Messaging" 
              description="Real-time chat with zero latency"
            />
            <FeatureCard 
              icon={Shield} 
              title="Secure & Private" 
              description="End-to-end encrypted conversations"
            />
            <FeatureCard 
              icon={Zap} 
              title="AI-Powered" 
              description="Smart features with RAG search"
            />
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-[420px]">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-fuchsia-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-70" />
            
            {/* Card */}
            <div className="relative rounded-2xl border border-white/10 bg-[#12121a]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              
              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full ">
                  <TabsList className="w-full grid grid-cols-2 gap-1 h-full p-1 rounded-xl bg-white/[0.03] border border-white/5">
                    <TabsTrigger 
                      value="Login" 
                      className="rounded-lg py-2.5 text-sm font-medium text-white/50 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-fuchsia-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-violet-500/30"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="Signup" 
                      className="rounded-lg py-2.5 text-sm font-medium text-white/50 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-fuchsia-500/20 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-violet-500/30"
                    >
                      Create Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="Login" className="mt-8 space-y-5">
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Email</label>
                      <InputField 
                        type="email"
                        placeholder="name@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        icon={Mail}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Password</label>
                      <InputField 
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        icon={Lock}
                        showToggle
                        isShown={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                      />
                    </div>

                    <button 
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : "Sign In"}
                    </button>

                    <p className="text-center text-sm text-white/30">
                      Don't have an account? <span onClick={() => setActiveTab("Signup")} className="text-violet-400 cursor-pointer hover:text-violet-300 hover:underline">Create one</span>
                    </p>
                  </TabsContent>

                  <TabsContent value="Signup" className="mt-8 space-y-5">
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Email</label>
                      <InputField 
                        type="email"
                        placeholder="name@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        icon={Mail}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Password</label>
                      <InputField 
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        icon={Lock}
                        showToggle
                        isShown={showPassword}
                        onToggle={() => setShowPassword(!showPassword)}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-white/50 mb-2 block">Confirm Password</label>
                      <InputField 
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        icon={Lock}
                        showToggle
                        isShown={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </div>

                    <button 
                      onClick={handleSignup}
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-purple-600 text-white font-semibold text-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating account...
                        </div>
                      ) : "Create Account"}
                    </button>

                    <p className="text-center text-sm text-white/30">
                      Already have an account? <span onClick={() => setActiveTab("Login")} className="text-violet-400 cursor-pointer hover:text-violet-300 hover:underline">Sign in</span>
                    </p>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Bottom gradient line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
