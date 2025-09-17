import { useState } from "react";
import { X, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { createInquiry, InquiryData } from "@/services/inquiryService";

interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface InquiryFormProps {
  listingId: string;
  listingTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InquiryForm({ listingId, listingTitle, open, onOpenChange }: InquiryFormProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<InquiryFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<InquiryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name ist erforderlich";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Nachricht ist erforderlich";
    } else if (formData.message.trim().length < 20) {
      newErrors.message = "Nachricht muss mindestens 20 Zeichen lang sein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const inquiryData: InquiryData = {
        listing_id: listingId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message
      };
      
      const success = await createInquiry(inquiryData);
      
      if (success) {
        setSubmitted(true);
        // Reset form after 3 seconds and close modal
        setTimeout(() => {
          setSubmitted(false);
          setFormData({ name: "", email: "", phone: "", message: "" });
          setErrors({});
          onOpenChange(false);
        }, 3000);
      } else {
        alert("Es gab einen Fehler beim Senden Ihrer Anfrage. Bitte versuchen Sie es später erneut.");
      }
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      alert("Es gab einen Fehler beim Senden Ihrer Anfrage. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof InquiryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitted(false);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setErrors({});
      onOpenChange(false);
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 border-0 bg-transparent shadow-none">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-green-50 rounded-3xl overflow-hidden">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-neutral-900">
                  Anfrage gesendet!
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Vielen Dank! Ihre Anfrage wurde erfolgreich übermittelt. 
                  Der Anbieter wird sich in Kürze bei Ihnen melden.
                </p>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-neutral-50 rounded-3xl overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-neutral-900">
                Anfrage senden
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full w-10 h-10 p-0 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-lg flex items-center justify-center text-xs font-bold text-neutral-600">
                  🚗
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">
                    {listingTitle}
                  </h4>
                  <p className="text-sm text-neutral-600">
                    Leasing-Übernahme anfragen
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-neutral-700">
                  Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`rounded-xl border-2 transition-colors ${
                    errors.name 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-neutral-200 focus:border-red-300"
                  }`}
                  placeholder="Ihr vollständiger Name"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                  E-Mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`rounded-xl border-2 transition-colors ${
                    errors.email 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-neutral-200 focus:border-red-300"
                  }`}
                  placeholder="ihre.email@beispiel.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-neutral-700">
                  Telefon (optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="rounded-xl border-2 border-neutral-200 focus:border-red-300 transition-colors"
                  placeholder="+41 XX XXX XX XX"
                  disabled={isSubmitting}
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-neutral-700">
                  Nachricht *
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className={`rounded-xl border-2 transition-colors min-h-[120px] resize-none ${
                    errors.message 
                      ? "border-red-300 focus:border-red-500" 
                      : "border-neutral-200 focus:border-red-300"
                  }`}
                  placeholder="Hallo, ich interessiere mich für die Leasingübernahme dieses Fahrzeugs. Können wir einen Termin vereinbaren?"
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center">
                  {errors.message && (
                    <p className="text-sm text-red-600">{errors.message}</p>
                  )}
                  <p className="text-xs text-neutral-500 ml-auto">
                    Mindestens 20 Zeichen ({formData.message.length}/20)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 h-12 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Wird gesendet...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Anfrage senden
                    </div>
                  )}
                </Button>
              </div>

              <p className="text-xs text-neutral-500 text-center leading-relaxed">
                Mit dem Absenden bestätigen Sie, dass Ihre Daten zur Bearbeitung 
                Ihrer Anfrage verwendet werden dürfen. Weitere Informationen finden 
                Sie in unserer Datenschutzerklärung.
              </p>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}