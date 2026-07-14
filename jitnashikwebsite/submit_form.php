/**
 * ==================================================================================
 * JIT NASHIK - CENTRALIZED FORM SUBMISSION HANDLER
 * ==================================================================================
 * DOCUMENTATION & CONFIGURATION GUIDE:
 * 
 * 1. RECIPIENT EMAIL: Change $to_email to update who receives these submissions.
 * 2. SENDER IDENTITY: Edit $from_name and $from_email for branding (use domain mail).
 * 3. FORM TYPES: This script automatically detects 'form_type' from hidden fields.
 * 4. SECURITY: Ensure your hosting provider supports PHP's mail() function.
 * ==================================================================================
 */

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // --- START CONFIGURATION ---
    $to_email = "principal@jitnashik.edu.in";    // <--- CHANGE THIS to redirect submissions
    $from_name = "JIT Web Portal";              // Displays as the sender's name in Inbox
    $from_email = "no-reply@jitnashik.edu.in";   // MUST be a valid domain email (usually)
    // --- END CONFIGURATION ---
    
    // Determine the form type
    $form_type = isset($_POST['form_type']) ? $_POST['form_type'] : "General Inquiry";
    $subject = "New Form Submission: " . $form_type;
    
    // Build email content
    $message_body = "You have received a new form submission from the JIT Nashik Website.\n\n";
    $message_body .= "--- FORM DETAILS ---\n";
    $message_body .= "Form Type: " . $form_type . "\n";
    $message_body .= "Timestamp: " . date("Y-m-d H:i:s") . "\n\n";
    
    $message_body .= "--- SUBMITTED DATA ---\n";
    
    // Loop through all post fields except 'form_type' and 'submit'
    foreach ($_POST as $key => $value) {
        if ($key != 'form_type' && $key != 'submit') {
            // Format key for better readability (e.g., full_name -> Full Name)
            $label = ucwords(str_replace('_', ' ', $key));
            $message_body .= $label . ": " . $value . "\n";
        }
    }
    
    $message_body .= "\n---------------------\n";
    $message_body .= "Sent from: " . $_SERVER['HTTP_REFERER'] . "\n";

    // Headers
    $headers = "From: $from_name <$from_email>\r\n";
    $headers .= "Reply-To: " . (isset($_POST['email']) ? $_POST['email'] : $from_email) . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Send email
    $success = mail($to_email, $subject, $message_body, $headers);

    // Provide feedback
    if (isset($_POST['is_ajax']) && $_POST['is_ajax'] == 'true') {
        header('Content-Type: application/json');
        if ($success) {
            echo json_encode(['status' => 'success', 'message' => 'Your application has been submitted successfully.']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to send email. Please try again later.']);
        }
    } else {
        // Simple redirect with status
        if ($success) {
            header("Location: " . $_SERVER['HTTP_REFERER'] . "?status=success");
        } else {
            header("Location: " . $_SERVER['HTTP_REFERER'] . "?status=error");
        }
    }
    exit;
} else {
    // Direct access denied
    die("Unauthorized Access");
}
?>
