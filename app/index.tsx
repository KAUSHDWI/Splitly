// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity,
  Animated, Dimensions, StatusBar, Platform, SafeAreaView, Pressable, 
  Modal as RNModal, Easing
} from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Polygon, Line } from "react-native-svg";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get("window");

/* ═══ TOKENS ═══════════════════════════════════════════════════════════ */
const C = {
  bg:"#0d0d12", card:"#13131a", cardAlt:"#1a1a24",
  border:"rgba(255,255,255,0.07)", text:"#f0f0f8", sub:"#a0a0c0", muted:"#505070",
  accent:"#7c5cfc", accentBg:"rgba(124,92,252,0.12)",
  green:"#00d68f", greenBg:"rgba(0,214,143,0.1)",
  red:"#ff4d6d", redBg:"rgba(255,77,109,0.1)",
  gold:"#ffbb33", goldBg:"rgba(255,187,51,0.1)",
  blue:"#4d9fff", blueBg:"rgba(77,159,255,0.1)",
  teal:"#00c9c9", tealBg:"rgba(0,201,201,0.1)",
  pink:"#ff6eb4", pinkBg:"rgba(255,110,180,0.1)",
  orange:"#ff8c42", orangeBg:"rgba(255,140,66,0.1)",
};

const MEMBER_META={
  "You":{av:"K",col:C.accent,bg:C.accentBg},
  "Rahul":{av:"R",col:C.blue,bg:C.blueBg},
  "Priya":{av:"P",col:C.pink,bg:C.pinkBg},
  "Arjun":{av:"A",col:C.gold,bg:C.goldBg},
  "Sneha":{av:"S",col:C.green,bg:C.greenBg},
  "Dev":{av:"D",col:C.teal,bg:C.tealBg},
  "Meera":{av:"M",col:C.orange,bg:C.orangeBg},
};

const GROUP_THEMES=[
  {grad:["#7c5cfc","#4d9fff"],glow:"#7c5cfc"},
  {grad:["#00d68f","#00c9c9"],glow:"#00d68f"},
  {grad:["#ff4d6d","#ff8c42"],glow:"#ff4d6d"},
  {grad:["#ffbb33","#ff8c42"],glow:"#ffbb33"},
  {grad:["#ff6eb4","#7c5cfc"],glow:"#ff6eb4"},
];

const GROUP_EMOJIS=["🏖️","🏠","🍕","🎂","🎮","✈️","🎉","🏕️","💼","🌴"];
const EXPENSE_CATS=["🍽️","🏨","🚗","🛒","🎮","🎬","⚡","📶","🎁","🍺"];

/* ═══ DATA FUNCTIONS ═══════════════════════════════════════════════════ */
function initGroups(){
  return[
    {id:1,emoji:"🏖️",name:"Goa Trip",members:["You","Rahul","Priya","Arjun","Sneha"],themeIdx:0,
      expenses:[{id:1,desc:"Hotel Booking",paidBy:"Rahul",amount:4200,split:5,date:"2h ago",cat:"🏨"},{id:2,desc:"Beach Dinner",paidBy:"You",amount:1800,split:5,date:"5h ago",cat:"🍽️"},{id:3,desc:"Scuba Diving",paidBy:"Priya",amount:6500,split:5,date:"3d ago",cat:"🤿"}]},
    {id:2,emoji:"🏠",name:"Flat Mates",members:["You","Priya","Dev"],themeIdx:1,
      expenses:[{id:5,desc:"Electricity Bill",paidBy:"You",amount:2400,split:3,date:"1d ago",cat:"⚡"},{id:6,desc:"Groceries",paidBy:"Priya",amount:980,split:3,date:"2d ago",cat:"🛒"}]},
    {id:3,emoji:"🍕",name:"Office Lunch",members:["You","Rahul","Arjun","Sneha"],themeIdx:2,
      expenses:[{id:8,desc:"Pizza Hut",paidBy:"Rahul",amount:1260,split:4,date:"3d ago",cat:"🍕"}]},
  ];
}

function computeBalance(groups){
  let youGet=0,youOwe=0;
  groups.forEach(g=>g.expenses.forEach(e=>{
    const pp=e.amount/e.split;
    if(e.paidBy==="You")youGet+=e.amount-pp;
    else if(g.members.includes("You"))youOwe+=pp;
  }));
  return{youGet:Math.round(youGet),youOwe:Math.round(youOwe),net:Math.round(youGet-youOwe)};
}

function groupBal(g){
  let get=0,owe=0;
  g.expenses.forEach(e=>{const p=e.amount/e.split;if(e.paidBy==="You")get+=e.amount-p;else owe+=p;});
  return Math.round(get-owe);
}

/* ═══ ICONS ══════════════════════════════════════════════════════════════ */
function Icon({name, size=22, color=C.muted, sw=1.8}){
  const p = { fill:"none", stroke:color, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round" };
  const Wrap = ({children}) => <Svg width={size} height={size} viewBox="0 0 24 24">{children}</Svg>;
  if(name==="home") return <Wrap><Path {...p} d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><Path {...p} d="M9 21V12h6v9"/></Wrap>;
  if(name==="layers") return <Wrap><Path {...p} d="M12 2L2 7l10 5 10-5-10-5z"/><Path {...p} d="M2 17l10 5 10-5"/><Path {...p} d="M2 12l10 5 10-5"/></Wrap>;
  if(name==="activity") return <Wrap><Polyline {...p} points="22,12 18,12 15,21 9,3 6,12 2,12"/></Wrap>;
  if(name==="user") return <Wrap><Path {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><Circle {...p} cx="12" cy="7" r="4"/></Wrap>;
  if(name==="plus") return <Wrap><Line {...p} x1="12" y1="5" x2="12" y2="19"/><Line {...p} x1="5" y1="12" x2="19" y2="12"/></Wrap>;
  if(name==="back") return <Wrap><Polyline {...p} points="15,18 9,12 15,6"/></Wrap>;
  if(name==="zap") return <Wrap><Polygon {...p} points="13,2 3,14 12,14 11,22 21,10 12,10"/></Wrap>;
  if(name==="close") return <Wrap><Line {...p} x1="18" y1="6" x2="6" y2="18"/><Line {...p} x1="6" y1="6" x2="18" y2="18"/></Wrap>;
  if(name==="mail") return <Wrap><Path {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><Polyline {...p} points="22,6 12,13 2,6"/></Wrap>;
  if(name==="lock") return <Wrap><Rect {...p} x="3" y="11" width="18" height="11" rx="2"/><Path {...p} d="M7 11V7a5 5 0 0110 0v4"/></Wrap>;
  if(name==="chart") return <Wrap><Line {...p} x1="18" y1="20" x2="18" y2="10"/><Line {...p} x1="12" y1="20" x2="12" y2="4"/><Line {...p} x1="6" y1="20" x2="6" y2="14"/></Wrap>;
  if(name==="logout") return <Wrap><Path {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></Wrap>;
  if(name==="credit") return <Wrap><Rect {...p} x="1" y="4" width="22" height="16" rx="2"/><Line {...p} x1="1" y1="10" x2="23" y2="10"/></Wrap>;
  if(name==="bell") return <Wrap><Path {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...p} d="M13.73 21a2 2 0 01-3.46 0"/></Wrap>;
  if(name==="settings") return <Wrap><Circle {...p} cx="12" cy="12" r="3"/><Path {...p} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06"/></Wrap>;
  return null;
}

/* ═══ SHARED COMPONENTS ════════════════════════════════════════════════ */
function Av({letter, color, bg, size=38, glow=false}){
  return (
    <View style={[styles.avBase, { width:size, height:size, borderRadius:size/2, backgroundColor:bg, borderColor:color+'30' }, 
      glow && { shadowColor:color, shadowOffset:{width:0, height:0}, shadowOpacity:0.6, shadowRadius:12, elevation:5 }]}>
      <Text style={{ color, fontSize:size*0.38, fontWeight:'800' }}>{letter}</Text>
    </View>
  );
}

function FloatInput({label, value, onChangeText, icon, secureTextEntry=false, type="default"}){
  const [focus, setFocus] = useState(false);
  const isLifted = focus || (value && value.toString().length > 0);
  return (
    <View style={styles.inputContainer}>
      <View style={[styles.inputIcon, { opacity:focus?1:0.5 }]}><Icon name={icon} size={18} color={focus?C.accent:C.muted} /></View>
      <Text style={[styles.inputLabel, { top:isLifted?8:22, fontSize:isLifted?10:15, color:focus?C.accent:C.muted, fontWeight:isLifted?'700':'400' }]}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value} onChangeText={onChangeText} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        secureTextEntry={secureTextEntry} keyboardType={type} selectionColor={C.accent}
        style={[styles.textInput, { paddingTop:isLifted?25:16, borderColor:focus?C.accent:C.border }]}
      />
    </View>
  );
}

function Modal({title, subtitle, onClose, children, visible}){
  return (
    <RNModal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable style={{flex:1}} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View><Text style={styles.modalTitle}>{title}</Text><Text style={styles.modalSub}>{subtitle}</Text></View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Icon name="close" size={16} color={C.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{padding: 22}}>{children}</ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

/* ═══ SCREEN COMPONENTS ════════════════════════════════════════════════ */

function SplashScreen({onDone}){
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true })
    ]).start(onDone);
  }, []);
  return (
    <LinearGradient colors={['#0d0520', '#050508']} style={styles.splashBg}>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <LinearGradient colors={['#7c5cfc', '#4d9fff']} style={styles.logoBox}><Icon name="plus" size={44} color="#fff" sw={3} /></LinearGradient>
        <Text style={styles.logoTitle}>Split<Text style={{color: C.accent}}>ly</Text></Text>
        <Text style={styles.logoSubText}>Split smarter • Settle faster</Text>
      </Animated.View>
    </LinearGradient>
  );
}

function LoginScreen({onLogin, onGoSignup}){
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <View style={styles.container}>
      <LinearGradient colors={['rgba(124,92,252,0.1)', 'transparent']} style={{height: 200, justifyContent:'center', alignItems:'center'}}>
        <View style={styles.heroCard}><Text style={styles.heroLabel}>YOU GET BACK</Text><Text style={styles.heroVal}>+₹1,840</Text></View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 25 }}>
        <Text style={styles.h1}>Welcome back 👋</Text>
        <Text style={styles.p}>Sign in to your Splitly account</Text>
        <View style={{marginTop: 30}}>
          <FloatInput label="Email address" icon="mail" value={email} onChangeText={setEmail} />
          <FloatInput label="Password" icon="lock" value={pass} onChangeText={setPass} secureTextEntry />
          <TouchableOpacity onPress={onLogin} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Sign In →</Text></TouchableOpacity>
          <TouchableOpacity onPress={onGoSignup} style={{ marginTop: 25, alignItems: 'center' }}><Text style={styles.p}>No account? <Text style={{ color: C.accent, fontWeight: '800' }}>Sign up free</Text></Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SignupScreen({onSignup, onGoLogin}){
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 25, paddingTop: 60 }}>
        <Text style={styles.h1}>Create account ✨</Text>
        <Text style={styles.p}>Start splitting expenses with friends</Text>
        <View style={{marginTop: 30}}>
          <FloatInput label="Full Name" icon="user" value={name} onChangeText={setName} />
          <FloatInput label="Email address" icon="mail" value={email} onChangeText={setEmail} />
          <FloatInput label="Password" icon="lock" value={pass} onChangeText={setPass} secureTextEntry />
          <TouchableOpacity onPress={onSignup} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Create Account →</Text></TouchableOpacity>
          <TouchableOpacity onPress={onGoLogin} style={{ marginTop: 25, alignItems: 'center' }}><Text style={styles.p}>Have an account? <Text style={{ color: C.accent, fontWeight: '800' }}>Sign in</Text></Text></TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function FlipCard({bal, groups}){
  const [side, setSide] = useState("front");
  const fade = useRef(new Animated.Value(1)).current;
  function flip(to){ Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => { setSide(to); Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start(); }); }
  return (
    <LinearGradient colors={['#120d28', side === 'chart' ? '#081818' : '#0a1428']} style={styles.balCard}>
      <Animated.View style={{opacity: fade}}>
        {side === 'front' ? (
          <View>
            <View style={styles.rowBetween}><View><Text style={styles.labelSmall}>NET BALANCE</Text><Text style={[styles.balAmount, { color: bal.net >= 0 ? C.green : C.red }]}>{bal.net >= 0 ? '+' : '-'}₹{Math.abs(bal.net).toLocaleString()}</Text></View>
            <TouchableOpacity onPress={()=>flip('chart')} style={styles.miniBtn}><Icon name="chart" size={16} /></TouchableOpacity></View>
            <View style={styles.rowBetween}><View><Text style={styles.labelSmall}>YOU GET</Text><Text style={{ color: C.green, fontWeight: '800' }}>₹{bal.youGet}</Text></View>
            <View style={{alignItems:'flex-end'}}><Text style={styles.labelSmall}>YOU OWE</Text><Text style={{ color: C.red, fontWeight: '800' }}>₹{bal.youOwe}</Text></View></View>
          </View>
        ) : (
          <View><View style={styles.rowBetween}><Text style={styles.labelSmall}>SPENDING BY GROUP</Text><TouchableOpacity onPress={()=>flip('front')}><Icon name="close" size={16} /></TouchableOpacity></View>
            {groups.map(g => (<View key={g.id} style={{marginBottom:10}}><View style={styles.rowBetween}><Text style={styles.pSmall}>{g.emoji} {g.name}</Text><Text style={styles.pSmall}>₹{g.expenses.reduce((s,e)=>s+e.amount,0)}</Text></View>
            <View style={{height:4, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:2, marginTop:5}}><View style={{width:'60%', height:'100%', backgroundColor:GROUP_THEMES[g.themeIdx % 2].glow, borderRadius:2}} /></View></View>))}
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

function AddExpenseModal({visible, onClose, onAdd, groupMembers}){
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("🍽️");
  return (
    <Modal visible={visible} onClose={onClose} title={step===1 ? "Add Expense" : "Split Details"} subtitle="Enter transaction details">
      {step === 1 ? (
        <View><Text style={styles.labelSmall}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>{EXPENSE_CATS.map(c => (<TouchableOpacity key={c} onPress={()=>setCat(c)} style={[styles.catItem, cat===c && {borderColor:C.accent, backgroundColor:C.accentBg}]}><Text style={{fontSize:20}}>{c}</Text></TouchableOpacity>))}</ScrollView>
          <FloatInput label="Description" icon="layers" value={desc} onChangeText={setDesc} />
          <FloatInput label="Amount (₹)" icon="credit" value={amount} onChangeText={setAmount} type="numeric" />
          <TouchableOpacity onPress={()=>setStep(2)} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Next Step →</Text></TouchableOpacity></View>
      ) : (
        <View><Text style={styles.labelSmall}>PAID BY</Text><View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20}}>{groupMembers.map(m => (<TouchableOpacity key={m} style={styles.paidByBtn}><Av letter={m[0]} size={24} color={C.accent} bg={C.accentBg} /><Text style={{color:C.text, marginLeft:8}}>{m}</Text></TouchableOpacity>))}</View>
          <TouchableOpacity onPress={()=>{onAdd({desc, amount, cat}); onClose(); setStep(1);}} style={styles.primaryBtn}><Text style={styles.primaryBtnText}>Add Expense ✓</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setStep(1)} style={{marginTop:15, alignItems:'center'}}><Text style={styles.p}>← Back</Text></TouchableOpacity></View>
      )}
    </Modal>
  );
}

/* ═══ MAIN APP ══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [tab, setTab] = useState("home");
  const [groups, setGroups] = useState(initGroups());
  const [showAdd, setShowAdd] = useState(false);
  const bal = computeBalance(groups);

  const handleAddExp = (e) => {
    const newExp = { ...e, id: Date.now(), split: groups[0].members.length, date: 'Just now', paidBy: 'You', amount: parseFloat(e.amount) };
    const updated = [...groups]; updated[0].expenses.unshift(newExp); setGroups(updated);
  };

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {screen === "splash" && <SplashScreen onDone={() => setScreen("login")} />}
      {screen === "login" && <LoginScreen onLogin={() => setScreen("home")} onGoSignup={() => setScreen("signup")} />}
      {screen === "signup" && <SignupScreen onSignup={() => setScreen("home")} onGoLogin={() => setScreen("login")} />}
      
      {screen === "home" && (
        <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
            {tab === "home" ? (
              <View><View style={styles.header}><View><Text style={styles.p}>Good afternoon,</Text><Text style={styles.h2}>Kaushlendra 👋</Text></View><Av letter="K" color={C.accent} bg={C.accentBg} size={45} glow /></View>
                <View style={{paddingHorizontal: 18}}><FlipCard bal={bal} groups={groups} /><View style={styles.quickActions}><TouchableOpacity onPress={()=>setShowAdd(true)} style={styles.actionItem}><Icon name="plus" color={C.accent} /><Text style={[styles.pSmall, {color:C.accent}]}>Add</Text></TouchableOpacity><TouchableOpacity style={styles.actionItem}><Icon name="send" color={C.green} /><Text style={[styles.pSmall, {color:C.green}]}>Send</Text></TouchableOpacity><TouchableOpacity style={styles.actionItem}><Icon name="layers" color={C.blue} /><Text style={[styles.pSmall, {color:C.blue}]}>Group</Text></TouchableOpacity></View>
                <Text style={styles.sectionTitle}>Your Groups</Text>{groups.map(g => (<TouchableOpacity key={g.id} style={styles.groupCard}><View style={styles.emojiBox}><Text style={{ fontSize: 22 }}>{g.emoji}</Text></View><View style={{ flex: 1, marginLeft: 15 }}><Text style={styles.groupName}>{g.name}</Text><Text style={styles.pSmall}>{g.members.length} members</Text></View><Text style={{color: groupBal(g) >= 0 ? C.green : C.red, fontWeight:'800'}}>{groupBal(g) >= 0 ? '+' : ''}₹{groupBal(g)}</Text></TouchableOpacity>))}</View></View>
            ) : tab === "activity" ? (
              <View style={{padding: 18}}><Text style={styles.h2}>Activity</Text>{groups.flatMap(g => g.expenses).map((e, i) => (<View key={i} style={styles.activityItem}><View style={styles.emojiBox}><Text style={{fontSize:20}}>{e.cat}</Text></View><View style={{flex:1, marginLeft:12}}><Text style={{color:C.text, fontWeight:'600'}}>{e.paidBy} paid for {e.desc}</Text><Text style={styles.pSmall}>{e.date}</Text></View><Text style={{color:C.text, fontWeight:'800'}}>₹{e.amount}</Text></View>))}</View>
            ) : (
              <View style={{padding: 18, alignItems:'center'}}><Av letter="K" size={80} color={C.accent} bg={C.accentBg} glow /><Text style={[styles.h2, {marginTop:15}]}>Kaushlendra</Text><TouchableOpacity onPress={()=>setScreen("login")} style={[styles.profileRow, {marginTop:40}]}><Icon name="logout" color={C.red}/><Text style={{color:C.red, marginLeft:15}}>Sign Out</Text></TouchableOpacity></View>
            )}
          </ScrollView>
          <View style={styles.navBar}>
            <TouchableOpacity onPress={()=>setTab('home')} style={styles.navItem}><Icon name="home" color={tab==='home'?C.accent:C.muted}/></TouchableOpacity>
            <TouchableOpacity onPress={()=>setTab('activity')} style={styles.navItem}><Icon name="activity" color={tab==='activity'?C.accent:C.muted}/></TouchableOpacity>
            <View style={styles.fabContainer}><TouchableOpacity onPress={()=>setShowAdd(true)} style={styles.fab}><Icon name="plus" color="#fff" size={30}/></TouchableOpacity></View>
            <TouchableOpacity onPress={()=>setTab('profile')} style={styles.navItem}><Icon name="user" color={tab==='profile'?C.accent:C.muted}/></TouchableOpacity>
            <TouchableOpacity style={styles.navItem}><Icon name="layers" /></TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
      <AddExpenseModal visible={showAdd} onClose={()=>setShowAdd(false)} onAdd={handleAddExp} groupMembers={groups[0].members} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  splashBg: { flex: 1, backgroundColor: '#020205', alignItems: 'center', justifyContent: 'center' },
  logoBox: { width: 90, height: 90, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoTitle: { color: '#fff', fontSize: 44, fontWeight: '900', marginTop: 20 },
  logoSubText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border },
  heroLabel: { color: C.sub, fontSize: 10, letterSpacing: 1 }, heroVal: { color: C.green, fontSize: 28, fontWeight: '800', marginTop: 5 },
  h1: { color: C.text, fontSize: 30, fontWeight: '900' }, h2: { color: C.text, fontSize: 24, fontWeight: '900' }, p: { color: C.muted, fontSize: 15 }, pSmall: { color: C.muted, fontSize: 12 },
  primaryBtn: { backgroundColor: C.accent, padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 15 }, primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20 },
  balCard: { padding: 25, borderRadius: 30, marginBottom: 20, borderWidth: 1, borderColor: C.border }, labelSmall: { color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 1.5, marginBottom: 5 },
  balAmount: { fontSize: 40, fontWeight: '900', marginBottom: 15 }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', marginBottom: 15 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 25 }, actionItem: { flex: 1, backgroundColor: C.card, padding: 15, borderRadius: 20, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 15 }, groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 16, borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  emojiBox: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor:C.bg }, groupName: { color: C.text, fontSize: 16, fontWeight: '700' },
  navBar: { height: 80, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', position:'absolute', bottom:0, width:W }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fabContainer: { width: 70, alignItems: 'center' }, fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.accent, marginTop: -45, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  inputContainer: { marginBottom: 15, position: 'relative' }, inputIcon: { position: 'absolute', left: 16, top: 22, zIndex: 2 }, inputLabel: { position: 'absolute', left: 48, zIndex: 2 },
  textInput: { width: '100%', paddingLeft: 48, paddingRight: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderRadius: 16, color: C.text, fontSize: 16, height: 65 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }, modalContent: { backgroundColor: C.card, borderTopLeftRadius: 35, borderTopRightRadius: 35, minHeight: 450, paddingBottom: 40 },
  modalHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 22, paddingBottom: 0 },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: '800' }, modalSub: { color: C.muted, fontSize: 14 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  catItem: { width: 50, height: 50, borderRadius: 15, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  activityItem: { flexDirection:'row', alignItems:'center', padding:15, backgroundColor:C.card, borderRadius:20, marginBottom:10, borderWidth:1, borderColor:C.border },
  profileRow: { flexDirection:'row', alignItems:'center', padding:18, backgroundColor:C.card, borderRadius:18, width:'100%', borderWidth:1, borderColor:C.border },
  miniBtn: { backgroundColor:'rgba(255,255,255,0.05)', padding:8, borderRadius:10 }, avBase: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});