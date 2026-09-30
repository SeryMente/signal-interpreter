using System;
using System.Linq;
internal static class Program
{
 static int Main(){var t=DateTimeOffset.UtcNow;var f=0;void C(string n,Func<bool>x){try{var p=x();Console.WriteLine($"{n}={(p?"PASS":"FAIL")}");if(!p)f++;}catch(Exception e){Console.WriteLine($"{n}=ERROR {e.Message}");f++;}}
 C("single-word-final",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Sí",t);return r.Flush(t.AddMilliseconds(100),"caption-cleared").Single().Text=="Sí";});
 C("no-premature-accumulation",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));return !r.Observe("Porque nos ha quitado el",t).Any()&&!r.Observe("Porque nos ha quitado el Prozac",t.AddSeconds(1)).Any();});
 C("no-premature-revision",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Necesito llamar al doctor",t);return !r.Observe("Necesito llamar a un doctor",t.AddSeconds(1)).Any();});
 C("stable-finalizes",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Hola",t);return r.Observe("Hola",t.AddMilliseconds(749)).Count==0&&r.Observe("Hola",t.AddMilliseconds(750)).Single().Text=="Hola";});
 C("stable-append",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Hola",t);r.Observe("Hola",t.AddMilliseconds(750));r.Observe("Hola mundo",t.AddMilliseconds(751));return r.Observe("Hola mundo",t.AddMilliseconds(1501)).Single().Text=="mundo";});
 C("stable-revision",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Necesito llamar al doctor",t);r.Observe("Necesito llamar al doctor",t.AddMilliseconds(750));r.Observe("Necesito llamar a un doctor",t.AddMilliseconds(751));return r.Observe("Necesito llamar a un doctor",t.AddMilliseconds(1501)).Single().Text=="Necesito llamar a un doctor";});
 C("replay-prefix-no-duplicate",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Hola. Gracias. Necesito llamar",t);var first=r.Observe("Hola. Gracias. Necesito llamar",t.AddMilliseconds(750));if(first.Single().Text!="Hola. Gracias. Necesito llamar")return false;r.Observe("Hola",t.AddMilliseconds(751));if(r.Observe("Hola",t.AddMilliseconds(1501)).Any())return false;r.Observe("Hola. Gracias",t.AddMilliseconds(1502));if(r.Observe("Hola. Gracias",t.AddMilliseconds(2252)).Any())return false;r.Observe("Hola. Gracias. Necesito llamar y",t.AddMilliseconds(2253));var next=r.Observe("Hola. Gracias. Necesito llamar y",t.AddMilliseconds(3003));return next.Single().Text=="y";});
 C("latest-revision-flush",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Necesito llamar al doctor",t);r.Observe("Necesito llamar a un doctor",t.AddSeconds(1));return r.Flush(t.AddSeconds(1.1),"caption-cleared").Single().Text=="Necesito llamar a un doctor";});
 C("duplicate-clear",()=>{var r=new CaptionReconciler(TimeSpan.FromMilliseconds(750));r.Observe("Hola",t);r.Flush(t.AddSeconds(1),"caption-cleared");return !r.Flush(t.AddSeconds(2),"caption-cleared").Any();});
 Console.WriteLine($"FAILURES={f}");Console.WriteLine(f==0?"RESULT=PASS":"RESULT=FAIL");return f==0?0:1;}
}
