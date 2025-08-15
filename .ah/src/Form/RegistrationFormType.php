<?php

namespace App\Form;

use App\Entity\User\User;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\Component\Validator\Constraints\Callback;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\IsTrue;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Context\ExecutionContextInterface;

class RegistrationFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('email', EmailType::class, [
                'label' => 'Email',
                'constraints' => [
                    new NotBlank([
                        'message' => 'Please enter your email',
                    ]),
                    new Email([
                        'message' => 'Please enter a valid email address',
                    ]),
                ],
            ])
            ->add('firstName', TextType::class, [
                'label' => 'First Name',
            ])
            ->add('lastName', TextType::class, [
                'label' => 'Last Name',
            ])
            ->add('jobTitle', TextType::class, [
                'label' => 'Job Title',
            ])
            ->add('agreeTerms', CheckboxType::class, [
                'mapped' => false,
                'constraints' => [
                    new IsTrue([
                        'message' => 'You should agree to our terms.',
                    ]),
                ],
            ])
            ->add('plainPassword', PasswordType::class, [
                'mapped' => false,
                'attr' => ['autocomplete' => 'new-password'],
                'constraints' => [
                    new NotBlank([
                        'message' => 'Please enter a password',
                    ]),
                    new Length([
                        'min'        => 6,
                        'minMessage' => 'Your password should be at least {{ limit }} characters',
                        'max'        => 4096,
                    ]),
                ],
            ])
            ->add('passwordConfirm', PasswordType::class, [
                'mapped' => false,
                'constraints' => [
                    new NotBlank([
                        'message' => 'Please confirm your password',
                    ]),
                    // Using Callback constraint to validate password matching
                    new Callback(function ($object, ExecutionContextInterface $context) {
                        $form = $context->getRoot();
                        $password = $form->get('plainPassword')->getData();
                        $passwordConfirm = $object;

                        if ($password !== $passwordConfirm) {
                            $context->buildViolation('Passwords do not match.')
                                ->atPath('passwordConfirm')
                                ->addViolation();
                        }
                    }),
                ],
                'label' => 'Confirm Password',
            ])
        ;
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => User::class,
        ]);
    }
}
