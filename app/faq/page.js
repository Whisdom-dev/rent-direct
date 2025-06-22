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
        },
        {
          question: "Why do landlords need to be verified?",
          answer: "Landlord verification is a crucial step to ensure the safety and security of our community. It helps us confirm that landlords are who they say they are, which protects tenants from potential scams and ensures all listings are legitimate."
        },
        {
            question: "What are the different verification levels?",
            answer: "We offer two levels of verification for landlords. 'Basic Verified' allows you to list up to two properties and is a quick process. 'Fully Verified' requires document submission and allows you to list unlimited properties, offering the highest level of trust to potential tenants."
        },
        {
            question: "What documents do I need for Full Verification?",
            answer: "For Full Verification, you will typically need to provide a government-issued ID, a document proving ownership of the property (like a deed or title), and a recent utility bill for proof of address. All documents are handled securely."
        },
        {
            question: "How long does verification take?",
            answer: "Basic verification is usually instant. Full verification, which involves a manual review of your documents, typically takes 2-3 business days. You will receive a notification on your dashboard once the process is complete."
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