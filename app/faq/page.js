"use client"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
  

export default function FAQPage() {
    const faqs = [
        {
          question: "How do I list my property?",
          answer: "To list your property, you need to create an account as a landlord. Once your account is set up, you can navigate to the 'List Your Property' section and fill out the necessary details about your rental."
        },
        {
          question: "Are there any fees for tenants?",
          answer: "No, RentDirect is completely free for tenants. You can search for properties, contact landlords, and manage your rental applications without any hidden fees."
        },
        {
          question: "How do I contact a property owner?",
          answer: "When you find a property you are interested in, you can use the 'Contact Owner' button on the property details page to send them a direct message through our secure platform."
        },
        {
          question: "What should I do if I suspect a fraudulent listing?",
          answer: "If you come across a listing that you believe to be fraudulent or suspicious, please report it to us immediately using the 'Report Listing' button. Our team will investigate it promptly."
        },
        {
            question: "How does the direct rental process work?",
            answer: "Our platform facilitates direct communication between tenants and landlords. This means you can discuss terms, schedule viewings, and sign agreements without the need for a real estate agent, saving both time and money."
        }
    ];

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
                <p className="text-lg text-gray-600 mt-2">Find answers to common questions about using RentDirect.</p>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
} 